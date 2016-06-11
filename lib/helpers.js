var helpers = {
  quotient: function (x, y) {
    return Math.floor(x / y);
  },
  mod: function (x, y) {
    return x - (y * this.quotient(x, y));
  },
  amod: function (x, y) {
    return y + this.mod(x, -1 * y);
  },
  weekdayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  getWeekdayName: function () {},
  getMonthName: function () {},
  getWeekdayAbbr: function (n) {
    if (n <= 7 && n >= 1) {
      return this.weekdayNames[n - 1].substring(0, 3);
    }
    return "Und";
  },
  getMonthAbbr: function (n) {
    if (n <= 12 && n >= 1) {
      return this.monthNames[n - 1].substring(0, 3);
    }
    return "Und";
  },
  getOrdinalSuffix: function (number) {
    if (number > 3 && number < 21) return 'th';
    switch (number % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }
};
module.exports = helpers;
global.helpers = module.exports;
