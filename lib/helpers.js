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
  getWeekdayAbbr: function () {},
  getMonthAbbr: function () {},
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
