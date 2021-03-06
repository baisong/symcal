// @TODO watch
// https://docs.npmjs.com/getting-started/creating-node-modules
// read
// https://www.terlici.com/2014/08/25/best-practices-express-structure.html
// http://www.innofied.com/node-js-best-practices/

const helpers = require('./lib/helpers');
const isostring = require('isostring');
// Derivation: 1000 * 60 * 60 * 24
const DAY_MILLISECONDS = 86400000;
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
  return Math.ceil((this - onejan) / DAY_MILLISECONDS);
};

var symcal = {};
symcal.mod = function (x, y) {
  return x - (y * symcal.quotient(x, y));
};
symcal.floor = function (x) {
  return Math.floor(x);
};
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
  var accumulator = symcal.mod(dividend, CYCLE_YEARS);
  return accumulator < CYCLE_LEAPS;
};

/**
 * Returns the fixed date of Jan 1 of the given symmetrical year.
 */
symcal.symNewYearDay = function (symYear) {
  var priorYear = symYear - 1;
  var shortTotal = (7 * 52 * priorYear) + 1;
  var leapTotal = symcal.floor(((CYCLE_LEAPS * priorYear) + LEAP_COEFFICIENT) / CYCLE_YEARS);
  return (7 * leapTotal) + shortTotal;
};
symcal.quotient = function (x, y) {
  return this.floor(x / y);
};
symcal.gregYearLength = function (gregYear) {
  var length = 365;
  if ((symcal.mod(gregYear, 4) == 0 && symcal.mod(gregYear, 100) != 0)
    || (symcal.mod(gregYear, 400) == 0)) {
    length++;
    length++;
  }
  return length;
};
symcal.gregYearLength = function (gregYear) {
  var length = 365;
  if (symcal.mod(gregYear, 4) == 0 && symcal.mod(gregYear, 100) != 0) {
    length++;
  }
  else if (symcal.mod(gregYear, 400) == 0) {
    length++;
  }
  return length;
};
symcal.cleanSource = function (input) {
  // @TODO Force noon UTC
  if (input instanceof Date) {
    return input.toISOString();
  }
  if (isostring(input)) {
    return (new Date(input)).toISOString();
  }
  if (symcal.isSymDate(input)) {
    return symcal.cleanSymDate(input);
  }
  return false;
};

symcal.cleanSymDate = function (symDate) {
  return {
    year: Number(symDate.year),
    dayOfYear: Number(symDate.dayOfYear)
  };
};

symcal.convert = function (input, format, distinctFormatting) {
  var source = symcal.cleanSource(input);
  if (source === false) {
    return false;
  }
  var format = format || 'short';
  if (isostring(source)) {
    return symcal.ISOStringToSym(source, format);
  }
  return symcal.symToISOString(source, format);
};

symcal.ISOStringToSym = function (ISOString, format) {
  var d = new Date(ISOString);
  var gregDate = {
    year: d.getFullYear(),
    dayOfYear: d.getDayNum()
  };
  var fixedDate = symcal.priorElapsedDays(gregDate.year) + gregDate.dayOfYear;
  var symDate = {
    year: symcal.fixedToSymYear(fixedDate)
  };
  symDate.dayOfYear = fixedDate - symcal.symNewYearDay(symDate.year) + 1;
  return symcal.expandSymDate(symDate);
};

symcal.priorElapsedDays = function (gregYear) {
  var priorYear = gregYear - 1;
  var days = (priorYear * 365) + 1;
  days += symcal.floor(priorYear / 4);
  days -= symcal.floor(priorYear / 100);
  days += symcal.floor(priorYear / 400);
  return days;
};

symcal.shiftGreg = function (isNegativeYear, gregDate) {
  if (isNegativeYear) {
    return {
      year: gregDate.year - 1,
      dayOfYear: gregDate.dayOfYear + symcal.gregYearLength(gregDate.year)
    };
  }
  return {
    year: gregDate.year + 1,
    dayOfYear: gregDate.dayOfYear - symcal.gregYearLength(gregDate.year)
  };
};

symcal.isResolvedGreg = function (isNegativeYear, gregDate) {
  if (isNegativeYear) {
    return gredDate.dayOfYear >= 0;
  }
  return gregDate.dayOfYear < symcal.gregYearLength(gregDate.year);
};

symcal.symToISOString = function (symDate, format) {
  var newYearDay = symcal.symNewYearDay(symDate.year);
  var fixedDate = newYearDay + symDate.dayOfYear - 1;
  var isNegativeYear = (fixedDate < 365);
  var gregDate = {
    year: 1,
    dayOfYear: fixedDate
  };
  while (!symcal.isResolvedGreg(isNegativeYear, gregDate)) {
    gregDate = symcal.shiftGreg(isNegativeYear, gregDate);
  }
  var d = (new Date(gregDate.year, 0)).setDate(gregDate.dayOfYear);
  // @TODO Force noon UTC
  return symcal.formatISOString(d, format);
};

symcal.formatISOString = function (date, format) {
  return new Date(date).toISOString();
};

symcal.fixedToSymYear = function (fixedDate) {
  var symYear = Math.ceil((fixedDate - 1) / MEAN_YEAR);
  var newYearDay = symcal.symNewYearDay(symYear);
  if (newYearDay < fixedDate) {
    if ((fixedDate - newYearDay) >= (7 * 52)
      && (fixedDate >= symcal.symNewYearDay(symYear + 1))) {
      symYear++;
    }
  }
  else if (newYearDay > fixedDate) {
    symYear--;
  }
  return symYear;
};

symcal.fixedToSym = function (fixedDate) {
  var symYear = symcal.fixedToSymYear(fixedDate);
  var startOfYear = symcal.symNewYearDay(symYear);
  var dayOfYear = fixedDate - startOfYear + 1;
  return {
    year: symYear,
    dayOfYear: dayOfYear
  };
};

symcal.symDaysInMonth = function (symDate) {
  if ((symDate.monthOfQuarter == 2)
    || (symDate.monthOfQuarter == 3 && symDate.quarter == 4 && symDate.isLeap)) {
    return 35;
  }
  return 28;
};

/**
 * Symmetrical (Distinct formatting)
 * Micro    1999/12/5/7
 * Short    1999/12/5/Sun
 * Standard 1999 Dec 5th Sun
 * Medium   5th Sunday, Dec 1999
 * Long     5th Sunday of December 1999
 */
symcal.formatSym = function (symDate, format) {
  var formatted = false;
  switch (format) {
    case 'micro':
      formatted = [symDate.year, symDate.monthOfYear, symDate.weekOfMonth, symDate.dayOfWeek].join('/');
      break;
    case 'short':
      formatted = [symDate.year, symDate.monthOfYear, symDate.weekOfMonth, symDate.dayOfWeekShort].join('/');
      break;
    case 'standard':
      formatted = [symDate.year, symDate.monthShort, symDate.weekOfMonth + symDate.weekOfMonthSuffix, symDate.dayOfWeekShort].join(' ');
      break;
    case 'medium':
      formatted = [symDate.weekOfMonth + symDate.weekOfMonthSuffix, symDate.dayOfWeekLong + ',', symDate.monthShort, symDate.year].join(' ');
      break;
    case 'long':
      formatted = [symDate.weekOfMonth + symDate.weekOfMonthSuffix, symDate.dayOfWeekLong, 'of', symDate.monthLong, symDate.year].join(' ');
      break;
  }

  return formatted;
};

symcal.expandSymDate = function (symDate) {
  // D.y.week
  symDate.yearWeek = Math.ceil(symDate.dayOfYear / 7);

  // D.quarter
  symDate.quarter = Math.ceil((4 / 53) * symDate.yearWeek);
  // D.q.day
  symDate.dayOfQuarter = symDate.dayOfYear - (13 * 7 * (symDate.quarter - 1));
  // D.q.week
  symDate.weekOfQuarter = Math.ceil(symDate.dayOfQuarter / 7);
  // D.q.month
  symDate.monthOfQuarter = Math.min(3, Math.ceil((2 / 9) * symDate.weekOfQuarter));

  // D.isLeap
  symDate.isLeap = symcal.isSymLeapYear(symDate.year);
  // D.m.days
  symDate.daysInMonth = symcal.symDaysInMonth(symDate);
  // D.month
  symDate.monthOfYear = 3 * (symDate.quarter - 1) + symDate.monthOfQuarter;
  // D.m.abbr
  symDate.monthShort = helpers.getMonthAbbr(symDate.monthOfYear);
  // D.m.name
  symDate.monthLong = helpers.monthNames[symDate.monthOfYear - 1];
  // D.m.day
  symDate.dayOfMonth = symDate.dayOfYear - ((28 * (symDate.monthOfYear - 1)) + (7 * symcal.quotient(symDate.monthOfYear, 3)));
  // D.m.d.abbr
  symDate.dayOfMonthSuffix = helpers.getOrdinalSuffix(symDate.dayOfMonth);
  // D.week
  symDate.weekOfMonth = Math.ceil(symDate.dayOfMonth / 7);
  // D.w.name
  symDate.weekOfMonthSuffix = helpers.getOrdinalSuffix(symDate.weekOfMonth);
  // D.day
  symDate.dayOfWeek = symcal.mod(symDate.dayOfYear - 1, 7) + 1;
  // D.d.abbr
  symDate.dayOfWeekShort = helpers.getWeekdayAbbr(symDate.dayOfWeek);
  // D.d.name
  symDate.dayOfWeekLong = helpers.weekdayNames[symDate.dayOfWeek - 1];

  /*
  var D = {
    isLeap: false,
    year: 2015,
    quarter: 1,
    month: 1,
    week: 1,
    day: 1,
    y: {
      week: 1,
    },
    q: {
      month: 1,
      week: 1,
      day: 1,
    },
    m: {
      name: "January",
      abbr: "Jan",
      day: 1
      d: {
        abbr: "1st"
      }
    },
    w: {
      name: "1st"
    },
    d: {
      name: "Monday",
      abbr: "Mon"
    }
  };

   */

  symDate.micro = symcal.formatSym(symDate, 'micro');
  symDate.short = symcal.formatSym(symDate, 'short');
  symDate.standard = symcal.formatSym(symDate, 'standard');
  symDate.medium = symcal.formatSym(symDate, 'medium');
  symDate.long = symcal.formatSym(symDate, 'long');
  symDate.daysInYear = (symDate.isLeap) ? (7 * 53) : (7 * 52);
  return symDate;
};

module.exports = symcal;
global.symcal = module.exports;
