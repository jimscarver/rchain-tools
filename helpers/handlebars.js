function hbsHelpers(hbs) {
  return hbs.create({
    helpers: { // This was missing
      inc: function(value, options) {
        return parseInt(value) + 1;
      },
      selected: function(option, value){
    if (option == value) {
        return ' selected';
    } else {
        return '';
    }
      },
      date: function(date) {
        //console.log(date);
        //return date;
        return ""+date.replace("T", " ").substring(0,16);
        //return date.getDate()+"/"+date.getMonth()+"/"+date.getFullYear()
    }
      // More helpers...
    }

  });
}

module.exports = hbsHelpers;