export default {
  displayName: 'MockParsingStrategy',
  //separator: ',',
  //headerSeparator: '\t',
  //firstRowContainsSummary: true,
  //headerParse: function (headerRow) {
  //  var looseHeaders = headerRow.split(this.headerDelimeter);
  //
  //  return looseHeaders.map(function (item) {
  //    return item.trim();
  //  });
  //},
  hooks: {
    preRow: function (cells, headers) {
      //let amount = cells.splice(5, 2);
      //console.log(cells);
      //cells.splice(5, 0, amount.join('.'));
      return cells;
    },

    preParse: function (line) {
      let currencyRegex = new RegExp(/(?:[,])([\d]{2,}),([\d]{2})/g);
      line = line.replace(currencyRegex, ',"$1.$2"');
      
      return line;
    }
  }
  //formatReturnObject: function (body, hasHeaders) {
  //
  //  var obj = {};
  //  if(hasHeaders) {
  //    obj.headers = this.headers;
  //  }
  //  var rows = [];
  //  var vm = this;
  //  var currencyRegex = new RegExp(/,(?=[\d]{2}\b)/);
  //  var dateRegex = new RegExp(/([\d]{2})\/([\d]{2})\/([\d]{4})/);
  //  var commaReplaceRegex = new RegExp(/(,(?![\d]{2},(?![\d]{2},)))/g);
  //  body.forEach(function (bodyRow) {
  //    // for each row in the body ...
  //    var row = {};
  //    if(!bodyRow.length) { return; }
  //    // Do some transforms..
  //
  //    bodyRow = bodyRow.replace(',,', ',$BLANK$,');
  //
  //    // Regex matches all commas with  $T$ tag (for splitting later) except for commas that appear in a currency value
  //    // it uses negative lookahead to discard matches that appear in between digits
  //    bodyRow = bodyRow.replace(commaReplaceRegex, '$T$');
  //    bodyRow.split('$T$').forEach(function (bodyColumn, index) {
  //      var current = index;
  //      if(vm.headers) {
  //        current = vm.headers[index];
  //      }
  //
  //      var intermediate = bodyColumn.replace('$BLANK$', '').trim();
  //
  //
  //
  //      if(intermediate.match(currencyRegex)) {
  //        intermediate = intermediate.replace(currencyRegex, '.');
  //
  //        row[current] = +(intermediate);
  //      } else if(intermediate.match(dateRegex)) {
  //        // Looks like a date.
  //        var date = moment(intermediate, 'DD/MM/YYYY').toDate();
  //        row[current] = date;
  //      } else {
  //        row[current] = intermediate;
  //      }
  //    });
  //
  //    rows.push(row);
  //  });
  //
  //
  //  obj.body = rows;
  //  return obj;
  //}
};
