function hbsHelpers(hbs) {
  return hbs.create({
    helpers: { // This was missing
      inc: function(value, options) {
        console.log('reading it');
        return parseInt(value) + 1;
      },
      selected: function(option, value){
        console.log(option+" --- "+value);
    if (option == value) {
        return ' selected';
    } else {
        return 'zzz'
    }
      }

      // More helpers...
    }

  });
}

module.exports = hbsHelpers;