const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const request = require('request');
const stats = require('stats-lite');
const exphbs  = require('express-handlebars');
const hbshelpers = require('./helpers/handlebars')(exphbs);

var labelDefault = "Governance"; 
var sortbyDefault = "UPDATED_AT"; 
var orderbyDefault = "DESC"; 


// setup, authentication and session boilerplate
// -------------------------------------------------------------------------------
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK
}, function(accessToken, refreshToken, profile, cb) {
    const user = {
      token: accessToken
    }
    cb(null, user);
  }
));

passport.serializeUser(function(obj, cb) {
  cb(null, obj);
});

passport.deserializeUser(function(accessToken, cb) {
  cb(null, accessToken);
});


const app = express();
// handlebars set up
// app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.engine('handlebars', hbshelpers.engine);
app.set('view engine', 'handlebars');
// exphbs.registerHelper('isEqual', function (expectedValue, value) {
//     return value === expectedValue;
//   });

// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: process.env.COOKIE_SECRET, resave: true, saveUninitialized: true }));


// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
// app.use(function(req, res, next) {
//   var sortby = req.cookies.sortby || sortbyDefault;
//    var orderby = req.cookies.orderby || orderbyDefault;
//    var label = req.cookies.label || labelDefault;
//   next();
// });

app.get('/login', passport.authenticate('github'));

app.get(
  '/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);
// --------------------------------------------------------------------------------
// Actual interesting code starts here
app.get('/', (req, res) => { // TODO: these shoud be in cookies
  var label = req.query.label || req.cookies.label || labelDefault;    
  var orderby = req.cookies.orderby || orderbyDefault;
  if ( ! orderby ) { // TODO why is this needed ?????
    orderby =  orderbyDefault;
  }
  console.log("label "+label+" orderby cookie "+req.cookies.orderby);
  var sortby;
  if (req.query.sortby != null ) {
    sortby = req.query.sortby;
    if (orderby == "DESC" ) {
      orderby="ASC";
    }  else {
      orderby = "DESC";
    }
  } else {
    
      sortby = req.cookies.sortby || sortbyDefault;    

  }
  //console.log("Cookie is: %o", req.cookies.label);
  res.cookie('orderby', orderby);
  res.cookie('sortby', sortby);
  res.cookie('label', label);
    
  if (req.user) {
    console.log("label "+label+" orderby "+orderby+" sortby "+sortby);
    const graphqlQuery = `
      query 
  {
  repository(owner: "rchain", name: "bounties") {
    labels(first: 100) {
      nodes {
        name
      }
    }
    issues(first: 100, labels: "`+label+`", states: [OPEN], orderBy: {field: `+sortby+`, direction: `+orderby+`}) {
  nodes {
        number
        title
        updatedAt
        createdAt
        author {
          login
        }
        labels(first: 10) {
          nodes {
            name
          }
        }
        comments (first: 1){
              totalCount
            }
      }
    }
  }
}
    `;
    console.log(graphqlQuery);
    const body = { query: graphqlQuery };
    request.post('https://api.github.com/graphql', {
      body,
      headers: {
        'User-Agent': 'my glitch app',
        'Authorization': `Bearer ${req.user.token}`,
      },
      json: true,
    }, (error, response, body) => {
      if (error) {
         console.log('error', error); 
      }
      
      const nodes = body.data.repository.issues.nodes;
      const labels = body.data.repository.labels.nodes.sort(); // todo: why arer they not sorted?
      
      res.render('home', { labels, label, nodes, sortby, orderby })
    })
  } else {
     // render homepage with login to GitHub button
    res.redirect('/login'); 
  }
})


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
