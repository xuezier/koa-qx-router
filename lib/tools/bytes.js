'use strict';

var parseRegExp = /^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb)$/i;

var formatThousandsRegExp = /\B(?=(\d{3})+(?!\d))/g;

var formatDecimalsRegExp = /(?:\.0*|(\.[^0]+)0+)$/;

// TODO: use is-finite module?
var numberIsFinite = Number.isFinite || function(v) {
  return typeof v === 'number' && isFinite(v);
};

var map = {
  b: 1,
  kb: 1 << 10,
  mb: 1 << 20,
  gb: 1 << 30,
  tb: ((1 << 30) * 1024)
};

module.exports = {
  parse: (val) => {
    if(typeof val === 'number' && !isNaN(val)) {
      return val;
    };

    var results = parseRegExp.exec(val);
    var floatValue;
    var unit = 'b';

    if(!results) {
      floatValue = parseInt(val, 10);
      unit = 'b';
    } else {
      floatValue = parseFloat(results[1]);
      unit = results[4].toLowerCase();
    };

    return Math.floor(map[unit] * floatValue);
  },
  format: (value, options) => {
    if(!numberIsFinite(value)) {
      return null;
    };

    var mag = Math.abs(value);
    var thousandsSeparator = (options && options.thousandsSeparator) || '';
    var unitSeparator = (options && options.unitSeparator) || '';
    var decimalPlaces = (options && options.decimalPlaces !== undefined) ? options.decimalPlaces : 2;
    var fixedDecimals = Boolean(options && options.fixedDecimals);
    var unit = 'B';

    if(mag >= map.tb) {
      unit = 'TB';
    } else if(mag >= map.gb) {
      unit = 'GB';
    } else if(mag >= map.mb) {
      unit = 'MB';
    } else if(mag >= map.kb) {
      unit = 'kB';
    };

    var val = value / map[unit.toLowerCase()];
    var str = val.toFixed(decimalPlaces);

    if(!fixedDecimals) {
      str = str.replace(formatDecimalsRegExp, '$1');
    }

    if(thousandsSeparator) {
      str = str.replace(formatThousandsRegExp, thousandsSeparator);
    }

    return str + unitSeparator + unit;
  }
};
