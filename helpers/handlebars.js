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
    },
      ifCond: function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
console.log( v1+" - "+v2);
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
}
      // More helpers...
    }

  });
}

module.exports = hbsHelpers;