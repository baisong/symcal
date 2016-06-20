/**
 * @TODO
 *  - Initialize, and on year change:
 *    1. Check for leap year, show/hide leap week
 *    2. Number all dates with data attributes for sym and greg
 *    3. Insert gregorian date number values on Mondays, Fridays, and greg month first days
 */

var today = new Date();
var demo = {
  year: today.getFullYear(),
  last_converted: '',
  monthNames: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
};

var formatGreg = function (dateObj) {
  dateObj = new Date(dateObj);
  return ['' + ((dateObj.getMonth() < 9) ? '0' : '') + (dateObj.getMonth() + 1), '' + ((dateObj.getDate() < 9) ? '0' : '') + dateObj.getDate(), dateObj.getFullYear()].join('/');
};
var $greg = $('#s454-gregorian');
var $s454 = $('#s454-symmetry454');
$(document).ready(function () {
  var $gregInput = $('#s454-gregorian');
  var $symInput = $('#s454-symmetry454');
  var convert = function (e) {
    var dateText = $gregInput.val();
    if (dateText != demo.last_converted) {
      if (/^(0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-]\d{4}$/.test(dateText)) {
        sd = symcal.convert(new Date(dateText), 'object');
        var year = sd.year;
        var quarter = sd.quarter;
        var month = sd.monthOfQuarter;
        var week = sd.weekOfMonth;
        var day = sd.dayOfWeek;
        var yearText = $('.yearname').text();
        if (parseInt(yearText) !== sd.year) {
          $('.yearname').text(year);
        }
        var display = 'none';
        if (sd.isLeap) {
          $('#m12').addClass('is-leap');
          $('#m12').removeClass('not-leap');
          display = 'block';
        }
        else {
          $('#m12').addClass('not-leap');
          $('#m12').removeClass('is-leap');
        }
        $('.leapweek').css({display: display});
        $('.date-selected').removeClass('date-selected');
        var sel = '.quarter:nth-of-type(' + quarter
          + ') .month:nth-of-type(' + month
          + ') .week:nth-of-type(' + week
          + ') .day:nth-of-type(' + day + ')';

        $(sel).addClass('date-selected');
        $s454.val(sd.standard);
        demo.last_converted = dateText;
        console.log(dateText + ' --> ' + sd.micro);
        console.log(sd);
        var $calendar = $('#calendar');
        $calendar.find('.day').each(function () {
          var $this = $(this);
          var day = parseInt($this.data('day'));
          if (day > 0) {
            var thisSymDate = symcal.expandSymDate({year: sd.year, dayOfYear: day});
            var thisGregDate = symcal.convert(thisSymDate, 'datepicker');
            var sym = thisSymDate.standard;
            $this.data('sym', sym);
            $this.data('greg', thisGregDate);
          }
        });
      }
    }
  };
  $gregInput.datepicker({
    onSelect: function (d, i) {
      if (d !== i.lastVal) {
        $(this).change();
      }
    }
  });
  $gregInput.change(convert);
  $gregInput.keydown(convert);
  $gregInput.blur(convert);
  function updateGregorian (year) {
    $('.yearname').text(year);
    var $days = $('#calendar .day');
    $days.each(function () {
      var $this = $(this);
      $this.text('');
      var day = parseInt($this.data('day'));
      if (day > 0) {
        var thisSymDate = symcal.expandSymDate({year: year, dayOfYear: day});
        var greg = symcal.convert(thisSymDate);
        var thisGregDate = formatGreg(greg);
        // var thisGregDateObj = symmetrical.convert(thisSymDate, 'object');
        var sym = thisSymDate.standard;
        $this.data('sym', sym);
        $this.data('greg', thisGregDate);
        var d = new Date(greg);
        if (thisSymDate.dayOfWeek == 1 || d.getDate() == 1) {
          var showMonth = false;
          var month = d.getMonth() + 1;
          if (thisSymDate.weekOfMonth == 1) {
            if (thisSymDate.dayOfMonth == 1 || thisSymDate.month < month) {
              showMonth = true;
            }
          }
          if (d.getDate() == 1) {
            showMonth = true;
          }
          var gregText = (showMonth) ? month + '/' : '';
          var gregText = gregText + d.getDate();
          $this.text(gregText);
        }
      }
    });
  }
  function sameDate (sym, greg) {
    var compare = symcal.convert(greg);
    if (sym.monthLong == 'May' && sym.dayOfMonth > 10) {
      var hello = 'food';
    }
    return sym.short == compare;
  }
  updateGregorian(demo.year);
  $gregInput.val(formatGreg(today, 'datepicker'));
  convert();
  // Select another date in this symmetrical year
  $('.day').click(function (e) {
    e.preventDefault();
    var $this = $(this);
    if ($this.hasClass('date-selected')) {
      $gregInput.val('');
      $symInput.val('');
      $this.removeClass('date-selected');
    }
    else {
      var gregDate = $this.data('greg');
      var symDate = $this.data('sym');
      $gregInput.val(gregDate);
      $symInput.val(symDate);
      if (!$this.hasClass('date-selected')) {
        $('.date-selected').removeClass('date-selected');
        $this.addClass('date-selected');
      }
    }
  });
  $('.addyear').click(function (e) {
    e.preventDefault();
    var year = parseInt($('.yearname').text()) + 1;
    var day = $('.date-selected').attr('id');
    updateGregorian(year);
    $gregInput.val($('#' + day).data('greg'));
    //$('.day').text('');
    convert();
  });
  $('.subyear').click(function (e) {
    e.preventDefault();
    var year = parseInt($('.yearname').text()) - 1;
    var day = $('.date-selected').attr('id');
    updateGregorian(year);
    $gregInput.val($('#' + day).data('greg'));
    //$('.day').text('');
    convert();
  });
  // Continuous update.
  function timeout () {
    setTimeout(function () {
      convert();
      timeout();
    }, 1000);
  }

  timeout();
});
