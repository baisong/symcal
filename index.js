const helpers = require('./lib/helpers');

Date.prototype.getDayNum = function () {
  var onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((this - onejan) / 86400000);
};

var symcal = {};

symcal.convert = function (source, format, distinctFormatting, altMonthRule, altLeapCycle, altMaxMonth) {
  var source = this.cleanSource(source);
  if (source === false) {
    return false;
  }
  var format = format || 'short';
  var converted = false;
  var target = false;
  if (this.isDateObj(source)) {
    target = 'sym';
    converted = this.convertDateObjectToSymDate(source, altMonthRule, altLeapCycle, altMaxMonth);
  }
  else if (this.isSymDate(source)) {
    target = 'greg';
    converted = this.convertSymDateToDateObject(source, altMonthRule, altLeapCycle);
  }
  if (converted === false) {
    return -1;
  }
  var formatted = converted;
  if (format != 'object') {
    formatted = this.formatDate(converted, target, format, distinctFormatting);
  }
  return formatted;
};

symcal.dateObjToGreg = function (dateObj) {
  var gregYear = dateObj.getFullYear();
  var dayOfYear = dateObj.getDayNum();
  return {
    year: gregYear,
    dayOfYear: dayOfYear
  };
};

symmetrical.gregToDateObj = function (gregDate) {
  var date = new Date(gregDate.year, 0);
  return new Date(date.setDate(gregDate.dayOfYear));
};

symcal.gregToSym = function (gregDate, leapCycle, monthRule, maxMonth) {
  var leapCycle = leapCycle || this.defaultLeapCycle;
  var monthRule = monthRule || this.defaultMonthRule;
  var maxMonth = maxMonth || this.defaultMaxMonth;
  var fixedDate = this.gregToFixed(gregDate);
  return this.fixedToSymFull(fixedDate, leapCycle, monthRule, maxMonth);
};

symcal.symToGreg = function (symDate, leapCycle, monthRule) {
  var leapCycle = leapCycle || this.defaultLeapCycle;
  var monthRule = monthRule || this.defaultMonthRule;
  var fixedDate = this.symToFixed(symDate.year, symDate.monthOfYear, symDate.dayOfMonth, leapCycle, monthRule);
  return this.fixedToGreg(fixedDate);
};

symcal.gregToFixed = function (gregDate) {
  var days = this.priorElapsedDays(gregDate.year);
  return days + gregDate.dayOfYear;
};

symcal.symToFixed = function (symYear, symMonth, symDay, leapCycle, monthRule) {
  var leapCycle = leapCycle || this.defaultLeapCycle;
  var monthRule = monthRule || this.defaultMonthRule;
  var newYearDay = this.symNewYearDay(symYear, leapCycle);
  var dayOfYear = this.symDayOfYear(symMonth, symDay, monthRule);
  return newYearDay + dayOfYear - 1;
};

symmetrical.fixedToGreg = function (fixedDate) {
  var epochYear = this.gregYearLength(this.gregEpoch);
  if (fixedDate >= epochYear) {
    var gregDate = this.fixedToGregPositive(fixedDate);
  } else {
    var gregDate = this.fixedToGregNegative(fixedDate);
  }
  return this.gregToDateObj(gregDate);
};

symmetrical.fixedToGregPositive = function (fixedDate) {
  var gregYear = this.gregEpoch;
  var yearLength = this.gregYearLength(gregYear);
  var dayOfYear = fixedDate;
  while (dayOfYear >= yearLength) {
    dayOfYear -= yearLength;
    gregYear++;
    yearLength = this.gregYearLength(gregYear);
  }
  return {
    year: gregYear,
    dayOfYear: dayOfYear
  };
};

symmetrical.fixedToGregNegative = function (fixedDate) {
  var gregYear = this.gregEpoch;
  var yearLength = this.gregYearLength(gregYear);
  var dayOfYear = fixedDate;
  while (dayOfYear < 0) {
    dayOfYear += yearLength;
    gregYear--;
    yearLength = this.gregYearLength(gregYear);
  }
  return {
    year: gregYear,
    dayOfYear: dayOfYear
  };
};

symcal.fixedToSym = function (fixedDate, leapCycle) {
  var leapCycle = leapCycle || this.defaultLeapCycle;
  var symYear = this.fixedToSymYear(fixedDate, leapCycle);
  var startOfYear = this.symNewYearDay(symYear);
  var dayOfYear = fixedDate - startOfYear + 1;
  return {
    year: symYear,
    dayOfYear: dayOfYear
  };
};

module.exports = symcal;
