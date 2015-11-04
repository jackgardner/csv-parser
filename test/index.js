import chai from 'chai';
import {CSVParser} from '../lib';
import fs from 'fs';
import path from 'path';
import MockParsingStrategy from './mockParsingStrategy';


const read = fs.createReadStream;
const expect = chai.expect;

describe('csv-parser', function () {
  it('simple csv', function (done) {
    collect('dummy.csv', verify);
    function verify(err, lines) {
      expect(err).to.equal(false);
      expect(lines).to.have.length(1);

      done();
    }
  });

  it('supports strings', function (done) {

    const parser = new CSVParser();

    parser.on('data', (data) => {
      expect(data).to.deep.equal({ hello: 'world' });
      done();
    });

    parser.write('hello\n');
    parser.write('world\n');

    parser.end();

  });


  it('newlines in a cell', function (done) {

    collect('newlines.csv', verify);

    function verify(err, lines) {

      expect(err).to.equal(false);
      expect(lines[0]).to.deep.equal({a: '1', b: '2', c: '3' });
      expect(lines[1]).to.deep.equal({a: 'Once upon\na time', b: '5', c: '6' });
      expect(lines[2]).to.deep.equal({a: '7', b: '8', c: '9' });

      done();
    }

  });

  it('supports strategies', function (done) {

    collect('invoinet.csv', { strategy: MockParsingStrategy, headerSeparator: '\t' }, verify);
    function verify(err, lines) {
      expect(err).to.equal(false);
      expect(lines[0].headers).to.have.length(16);
      expect(lines[4].Amount).to.equal("276.00");
      expect(lines[4]['Discounted Amount']).to.equal("269.97");
      expect(lines).to.have.length(40);
      done();
    }

  });
});

function fixture(name) {
  return path.join(__dirname, 'data', name);
}

function collect(file, opts, cb) {
  if (typeof opts === 'function') {
    return collect(file, {}, opts);
  }
  const data = read(fixture(file));
  const lines = [];
  const parser = new CSVParser(opts);
  data
    .pipe(parser)
    .on('data', function (line) {
      lines.push(line);
    })
    .on('error', function (err) {
      cb(err, lines);
    })
    .on('end', function () {
      cb(false, lines);
    });
  return parser;
}
