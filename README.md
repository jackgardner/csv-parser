# sh-csv-parser
> Streaming CSV parser with Strategy support


## Install

```sh
$ npm install --save sh-csv-parser
```


## Usage

```js
var csvParser = require('sh-csv-parser');

fs.readFile('mycsv.csv')
  .pipe(new csvParser())
  .end();
```

## Developing

```sh
$ npm test
```
## License

MIT © [Jack Gardner]()


[npm-image]: https://badge.fury.io/js/csv-parser.svg
[npm-url]: https://npmjs.org/package/csv-parser
[travis-image]: https://travis-ci.org/jackgardner/csv-parser.svg?branch=master
[travis-url]: https://travis-ci.org/jackgardner/csv-parser
[daviddm-image]: https://david-dm.org/jackgardner/csv-parser.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/jackgardner/csv-parser
