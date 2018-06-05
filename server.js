const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const request = require('request');
const stats = require('stats-lite');
const exphbs  = require('express-handlebars');
const hbshelpers = require('./helpers/handlebars')(exphbs);

const labelDefault = "Governance"; 
const sortbyDefault = "UPDATED_AT"; 
const orderbyDefault = "DESC"; 
const styleDefault = "night";
var state = "OPEN"
var labeltext;
var mylabels = [];
var alllabels = [];

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
// serve home page
app.get('/', (req, res) => { 
  if (req.query.issue ) {
    if ( req.query.action == "vote" ) {
      res.writeHead(301,
      {Location: "https://rewards.rchain.coop/index.php?-action=related_records_list&-related-record-id=issue%2FBudgetVotes%3Fnum%3D"+req.query.issue+"%26BudgetVotes%253A%253Apay_period%3D2018-05-01%26BudgetVotes%253A%253Aissue_num%3D"+req.query.issue+"%26BudgetVotes%253A%253Avoter%3DOjimadu&-table=issue&num=%3D"+req.query.issue+"&-ui-root=main-content&-sort=num+desc&-cursor=0&-skip=0&-limit=30&-mode=list&-relationship=Rewards"}
      );
    } else {
      res.writeHead(301,
      {Location: 'https://github.com/rchain/bounties/issues/'+req.query.issue}
      );
    }
    res.end();
  }
  var label = req.query.label || req.cookies.label || labelDefault;    
  var orderby = req.cookies.orderby || orderbyDefault;
  if ( ! orderby ) { // TODO why is this needed ?????
    orderby =  orderbyDefault;
  }
  var style = req.query.style || req.cookies.style || styleDefault;
  if ( ! orderby ) { // TODO why is this needed ?????
    orderby =  orderbyDefault;
  }
  console.log("label "+label+" orderby cookie "+req.cookies.orderby);
  state = req.query.state || state;
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
  res.cookie('style', style);
    
  if (req.user) {
    var labelcond = label == "ALL" ? "" : 'labels: "'+label+'"';
    console.log("label "+label+" orderby "+orderby+" sortby "+sortby);
    const graphqlQuery = `
      query 
  {
  viewer {
login
avatarUrl
}
  repository(owner: "rchain", name: "bounties") {
    labels(first: 100) {
      nodes {
        name
        description
      }
    }
    issues(first: 100, `+labelcond+`, states: [`+state+`], orderBy: {field: `+sortby+`, direction: `+orderby+`}) {
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
      const labels = body.data.repository.labels.nodes.sort(); // todo: why are they not sorted?
      //labels.unshift( {name: "ALL", description: "All issues"} );
      var login = body.data.viewer.login;
      var avatarUrl = body.data.viewer.avatarUrl;
      mylabels = [];
      alllabels = [];
      labeltext= "ALL Labels";
      for (const obj of body.data.repository.labels.nodes) {
       alllabels.push(obj.name);
        if(obj.name == label) {
         //console.log(obj.description);
         labeltext=obj.description;
       }
        var desc = obj.description;
        if (desc && desc.includes(body.data.viewer.login)) {
           mylabels.push(obj.name);
        }
      }
      alllabels = alllabels.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
      alllabels.unshift("ALL");
      res.render('home', { alllabels, label, nodes, sortby, orderby, 
                          labeltext, login, mylabels, state, style, avatarUrl })
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
