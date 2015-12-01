'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _generateObjectProperty = require('generate-object-property');

var _generateObjectProperty2 = _interopRequireDefault(_generateObjectProperty);

var _generateFunction = require('generate-function');

var _generateFunction2 = _interopRequireDefault(_generateFunction);

var CSVParser = (function (_stream$Transform) {
  _inherits(CSVParser, _stream$Transform);

  function CSVParser() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var headers = _ref.headers;
    var _ref$escapeCharacter = _ref.escapeCharacter;
    var escapeCharacter = _ref$escapeCharacter === undefined ? '"' : _ref$escapeCharacter;
    var _ref$newLine = _ref.newLine;
    var newLine = _ref$newLine === undefined ? '\n' : _ref$newLine;
    var _ref$headerSeparator = _ref.headerSeparator;
    var headerSeparator = _ref$headerSeparator === undefined ? ',' : _ref$headerSeparator;
    var _ref$separator = _ref.separator;
    var separator = _ref$separator === undefined ? ',' : _ref$separator;
    var strategy = _ref.strategy;
    var _ref$strict = _ref.strict;
    var strict = _ref$strict === undefined ? false : _ref$strict;

    _classCallCheck(this, CSVParser);

    _get(Object.getPrototypeOf(CSVParser.prototype), 'constructor', this).call(this, { objectMode: true, highWaterMark: 16 });

    this.separator = new Buffer(separator)[0];
    this.headerSeparator = new Buffer(headerSeparator)[0];
    this.escapeCharacter = new Buffer(escapeCharacter)[0];
    this.newLine = new Buffer(newLine)[0];
    this.cr = new Buffer('\r')[0];

    this.strategy = strategy;
    this.strict = strict;
    this.headers = headers;
    this._first = true;
    this._prevEnd = 0;
    this._prev = null;

    this._escaped = false;

    if (this.headers) {
      this._first = false;
      this.compile(this.headers);
    }
  }

  _createClass(CSVParser, [{
    key: 'compile',
    value: function compile() {
      if (this._Row) {
        return;
      }

      var rowFn = (0, _generateFunction2['default'])()('function Row (cells) {');
      this.headers.forEach(function (cell, i) {
        rowFn('%s = cells[%d]', (0, _generateObjectProperty2['default'])('this', cell), i);
      });

      rowFn('}');

      this._Row = rowFn.toFunction();

      if (Object.defineProperty) {
        Object.defineProperty(this._Row.prototype, 'headers', {
          enumerable: false,
          value: this.headers
        });
      } else {
        this._Row.prototype.headers = this.headers;
      }
    }
  }, {
    key: '_emit',
    value: function _emit(Row, cells) {
      this.push(new Row(cells));
    }
  }, {
    key: 'onCell',
    value: function onCell(buffer, start, end) {
      if (buffer[start] === this.escapeCharacter && buffer[end - 1] === this.escapeCharacter) {
        start++;
        end--;
      }

      var y = start;

      for (var i = start; i < end; i++) {
        if (buffer[i] === this.escapeCharacter && buffer[i + 1] === this.escapeCharacter) {
          i++;
        }
        if (y !== i) {
          buffer[y] = buffer[i];
        }

        y++;
      }

      return CSVParser.onValue(buffer, start, y);
    }
  }, {
    key: 'parseLine',
    value: function parseLine(buffer, start, end) {
      end--; // trim newline
      if (!this.customNewline && buffer.length && buffer[end - 1] === this.cr) {
        end--;
      }

      var comma = undefined;
      var cells = [];
      var isEscaped = false;
      var offset = start;

      if (this._first && !this.headers) {
        comma = this.headerSeparator;
      } else {
        comma = this.separator;
      }

      for (var i = start; i < end; i++) {
        if (buffer[i] === this.escapeCharacter) {
          // "
          if (i < end - 1 && buffer[i + 1] === this.escapeCharacter) {
            // ""
            i++;
          } else {
            isEscaped = !isEscaped;
          }
          continue;
        }

        if (buffer[i] === comma && !isEscaped) {
          var value = this.onCell(buffer, offset, i);
          cells.push(value);
          offset = i + 1;
        }
      }

      if (offset < end) {
        cells.push(this.onCell(buffer, offset, end));
      }
      if (buffer[end - 1] === comma) {
        cells.push(this._empty);
      }

      if (this._first) {
        this._first = false;
        this.headers = cells;
        this.compile(cells);
        this.emit('headers', this.headers);
        return;
      }

      if (this.strict && cells.length !== this.headers.length) {
        this.emit('error', new Error('Row length does not match headers'));
      } else {
        if (this.strategy && this.strategy.hooks) {

          if (this.strategy.hooks.preRow) {
            cells = this.strategy.hooks.preRow(cells, this.headers);
          }
        }
        this._emit(this._Row, cells);
      }
    }
  }, {
    key: '_transform',
    value: function _transform(chunk, encoding, callback) {
      if (typeof chunk === 'string') {
        chunk = new Buffer(chunk);
      }

      if (this.strategy && this.strategy.hooks && this.strategy.hooks.preParse) {

        var stringToRefine = chunk.toString('utf-8', 0, chunk.length);
        stringToRefine = this.strategy.hooks.preParse(stringToRefine);

        chunk = new Buffer(stringToRefine);
      }

      var start = 0;
      var buffer = chunk;

      if (this._prev) {
        start = this._prev.length;
        buffer = Buffer.concat([this._prev, chunk]);
        this._prev = null;
      }

      // Walk the chunk until we get to a new line, and then send that for parsing
      for (var i = start; i < buffer.length; ++i) {
        if (buffer[i] === this.escapeCharacter) {
          this._escaped = !this._escaped;
        }

        if (!this._escaped) {
          if (buffer[i] === this.newLine) {
            this.parseLine(buffer, this._prevEnd, i + 1);
            this._prevEnd = i + 1;
          }
        }
      }
      if (this._prevEnd === buffer.length) {
        this._prevEnd = 0;
        return callback();
      }

      if (buffer.length - this._prevEnd < chunk.length) {
        this._prev = chunk;
        this._prevEnd -= buffer.length - chunk.length;
        return callback();
      }

      this._prev = buffer;
      callback();
    }
  }, {
    key: '_flush',
    value: function _flush(callback) {
      if (this._escaped || !this._prev) {
        return callback();
      }
      this.parseLine(this._prev, this._prevEnd, this._prev.length + 1); // plus since online -1s
      callback();
    }
  }], [{
    key: 'onValue',
    value: function onValue(buffer, start, end) {

      return buffer.toString('utf-8', start, end);
    }
  }]);

  return CSVParser;
})(_stream2['default'].Transform);

exports.CSVParser = CSVParser;