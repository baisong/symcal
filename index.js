const helpers = require('./lib/helpers');
const isostring = require('isostring');

const WEEK_LENGTH = 7;
const YEAR_WEEKS = 52;
//  Derivation: YEAR_WEEKS * WEEK_LENGTH;
const YEAR_DAYS = 364;

// Length of a leap cycle in the standard Symmetry454 calendar system.
const CYCLE_YEARS = 293;
// The number of leap years during one leap cycle in the Symmetry454 system.
const CYCLE_LEAPS = 52;
// Used to determine whether a year is leap. Derivation: (CYCLE_YEARS - 1) / 2
const LEAP_COEFFICIENT = 146;
// Derivation: ((CYCLE_YEARS * 52) + CYCLE_LEAPS))  * 7) / CYCLE_YEARS
const MEAN_YEAR = 365.24232081911265;

Date.prototype.getDayNum = function () {
  var onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((this - onejan) / 86400000);
};

var symcal = {};

symcal.isSymDate = function (symDate) {
  if (typeof symDate.year == 'undefined' || !Number.isInteger(Number(symDate.year))) {
    return false;
  }
  if (typeof symDate.dayOfYear == 'undefined' || !Number.isInteger(Number(symDate.dayOfYear))) {
    return false;
  }
  return true;
};

symcal.isSymLeapYear = function (symYear) {
  var dividend = (CYCLE_LEAPS * symYear) + LEAP_COEFFICIENT;
  var accumulator = helpers.mod(dividend, CYCLE_YEARS);
  return accumulator < CYCLE_LEAPS;
};

/**
 * Returns the fixed date of Jan 1 of the given symmetrical year.
 */
symcal.symNewYearDay = function (symYear) {
  var priorYear = symYear - 1;
  var shortTotal = this.symEpoch + (this.yearShort() * priorYear);
  var leapTotal = this.floor(((CYCLE_LEAPS * priorYear) + LEAP_COEFFICIENT) / CYCLE_YEARS);
  return shortTotal + (this.weekLength * leapTotal);
};

symcal.cleanSource = function (input, sourceTimezone) {
  if (input instanceof Date) {
    // @TODO include Timezone
    return input.toISOString();
  }
  if (isostring(input)) {
    // @TODO include Timezone
    return (new Date(input)).toISOString();
  }
  if (this.isSymDate(input)) {
    return this.cleanSymDate(input);
  }
  return false;
};

symcal.cleanSymDate = function (symDate) {
  return {
    year: Number(symDate.year),
    dayOfYear: Number(symDate.dayOfYear)
  };
};

symcal.convert = function (input, format, distinctFormatting, targetTimezone, sourceTimezone) {
  sourceTimezone = sourceTimezone || '';
  var source = this.cleanSource(input);
  if (source === false) {
    return false;
  }
  var format = format || 'short';
  var targetTimezone = targetTimezone || '';
  if (isostring(source)) {
    return this.ISOStringToSym(source, format, targetTimezone);
  }
  return this.symToISOstring(source, format, targetTimezone);
};

symcal.ISOStringToSym = function (ISOString, format, targetTimezone) {
  var d = new Date(ISOString);
  var gregDate = {
    year: d.getFullYear(),
    dayOfYear: d.getDayOfYear()
  };
  var fixedDate = this.priorElapsedDays(gregDate.year) + gregDate.dayOfYear;
  return this.fixedToSymFull(fixedDate, format, targetTimezone);
};

symcal.symToISOString = function (symDate, format, targetTimezone) {
  // sym to fixed
  var fixedDate = this.symNewYearDay(symDate.year) + symDate.dayOfYear - 1;

  // fixed to greg
  // greg to isostring (include format, tz here)

};

symcal.gregToISOString = function (gregDate, targetTimezone) {
  var date = new Date(gregDate.year, 0);
  return new Date(date.setDate(gregDate.dayOfYear));
};

symcal.symToGreg = function (symDate) {
  var fixedDate = this.symToFixed(symDate.year, symDate.monthOfYear, symDate.dayOfMonth);
  return this.fixedToGreg(fixedDate);
};

symcal.fixedToGreg = function (fixedDate) {
  var epochYear = this.gregYearLength(this.gregEpoch);
  if (fixedDate >= epochYear) {
    var gregDate = this.fixedToGregPositive(fixedDate);
  } else {
    var gregDate = this.fixedToGregNegative(fixedDate);
  }
  return this.gregToDateObj(gregDate);
};

symcal.fixedToGregPositive = function (fixedDate) {
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

symcal.fixedToGregNegative = function (fixedDate) {
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

symcal.fixedToSym = function (fixedDate) {
  var symYear = this.fixedToSymYear(fixedDate);
  var startOfYear = this.symNewYearDay(symYear);
  var dayOfYear = fixedDate - startOfYear + 1;
  return {
    year: symYear,
    dayOfYear: dayOfYear
  };
};

symcal.symToSymFull = function (symDate) {
  symDate.yearWeek = Math.ceil(symDate.dayOfYear / this.weekLength);
  symDate.quarter = Math.ceil((this.quarters / this.weeksInLongYear) * symDate.yearWeek);
  symDate.dayOfQuarter = symDate.dayOfYear - (this.daysInQuarter() * symDate.quarter) + this.daysInQuarter();
  symDate.weekOfQuarter = Math.ceil(symDate.dayOfQuarter / this.weekLength);
  symDate.monthOfQuarter = this.symMonthOfQuarter(symDate);
  symDate.isLeap = this.isSymLeapYear(symDate.year);
  symDate.daysInMonth = this.symDaysInMonth(symDate, symDate.isLeap);
  symDate.monthOfYear = this.monthsInQuarter() * (symDate.quarter - 1) + symDate.monthOfQuarter;
  symDate.monthShort = this.getMonthAbbr(symDate.monthOfYear);
  symDate.monthLong = this.months[symDate.monthOfYear].name;
  symDate.dayOfMonth = symDate.dayOfYear - this.symDaysBeforeMonth(symDate.monthOfYear);
  symDate.dayOfMonthSuffix = this.getOrdinalSuffix(symDate.dayOfMonth);
  symDate.weekOfMonth = Math.ceil(symDate.dayOfMonth / this.weekLength);
  symDate.weekOfMonthSuffix = this.getOrdinalSuffix(symDate.weekOfMonth);
  symDate.dayOfWeek = this.modulus(symDate.dayOfYear - 1, 7) + 1;
  symDate.dayOfWeekShort = this.getWeekdayAbbr(symDate.dayOfWeek);
  symDate.dayOfWeekLong = this.weekdays[symDate.dayOfWeek].name;
  symDate.micro = this.formatSym(symDate, 'micro');
  symDate.short = this.formatSym(symDate, 'short');
  symDate.standard = this.formatSym(symDate, 'standard');
  symDate.medium = this.formatSym(symDate, 'medium');
  symDate.long = this.formatSym(symDate, 'long');
  symDate.daysInYear = (symDate.isLeap) ? this.yearLong() : this.yearShort();
  return symDate;
};

module.exports = symcal;
