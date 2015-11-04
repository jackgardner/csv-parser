import stream from 'stream';
import genobj from 'generate-object-property';
import genfun from 'generate-function';

export class CSVParser extends stream.Transform {
  constructor({ headers, escapeCharacter = '"', newLine = '\n', headerSeparator = ',', separator = ',', strategy, strict = false } = {}) {
    super({objectMode: true, highWaterMark: 16});

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

  compile() {
    if (this._Row) {
      return;
    }

    let rowFn = genfun()('function Row (cells) {');
    this.headers.forEach(function (cell, i) {
      rowFn('%s = cells[%d]', genobj('this', cell), i);
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

  _emit(Row, cells) {
    this.push(new Row(cells));
  }


  onCell(buffer, start, end) {
    if (buffer[start] === this.escapeCharacter && buffer[end - 1] === this.escapeCharacter) {
      start++;
      end--;
    }

    let y = start;

    for (let i = start; i < end; i++) {
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

  static onValue(buffer, start, end) {


    return buffer.toString('utf-8', start, end);
  }

  parseLine(buffer, start, end) {
    end--; // trim newline
    if (!this.customNewline && buffer.length && buffer[end - 1] === this.cr) {
      end--;
    }






    let comma;
    let cells = [];
    let isEscaped = false;
    let offset = start;

    if (this._first && !this.headers) {
      comma = this.headerSeparator;
    } else {
      comma = this.separator;
    }

    for (let i = start; i < end; i++) {
      if (buffer[i] === this.escapeCharacter) { // "
        if (i < end - 1 && buffer[i + 1] === this.escapeCharacter) { // ""
          i++;
        } else {
          isEscaped = !isEscaped;
        }
        continue;
      }


      if (buffer[i] === comma && !isEscaped) {
        let value = this.onCell(buffer, offset, i);
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
      if(this.strategy && this.strategy.hooks) {

        if(this.strategy.hooks.preRow) {
          cells = this.strategy.hooks.preRow(cells, this.headers);
        }

      }
      this._emit(this._Row, cells);
    }
  }

  _transform(chunk, encoding, callback) {
    if (typeof chunk === 'string') {
      chunk = new Buffer(chunk);
    }

    if(this.strategy && this.strategy.hooks && this.strategy.hooks.preParse) {

        let stringToRefine = chunk.toString('utf-8', 0, chunk.length);
        stringToRefine = this.strategy.hooks.preParse(stringToRefine);

        chunk = new Buffer(stringToRefine);
    }

    let start = 0;
    let buffer = chunk;

    if (this._prev) {
      start = this._prev.length;
      buffer = Buffer.concat([this._prev, chunk]);
      this._prev = null;
    }

    // Walk the chunk until we get to a new line, and then send that for parsing
    for (let i = start; i < buffer.length; ++i) {
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

  _flush(callback) {
    if (this._escaped || !this._prev) {
      return callback();
    }
    this.parseLine(this._prev, this._prevEnd, this._prev.length + 1);// plus since online -1s
    callback();
  }
}
