/*
 
 GENERATE TWEETS BY SELECTING ONE CELL FROM EACH COLUMN
 
*/

function getColumnSelectText(count) {
  var p = PropertiesService.getScriptProperties().getProperties();

  if (typeof count !== "undefined") {
    var quota = count;
  } else {
    var quota = 1;
  }

  var rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("columns")
    .getDataRange();
  var values = rows.getValues();
  var numRows = rows.getNumRows();
  var numCols = rows.getNumColumns();

  var list = new Array();

  for (var r = 4; r < numRows; r++) {
    var thisRow = values[r];

    for (var c = 1; c < numCols; c++) {
      if (typeof thisRow[c] !== "undefined") {
        if (typeof list[c] == "undefined") {
          list[c] = new Array();
        }
        list[c].push(thisRow[c]);
      }
    }
  }

  for (var q = 0; q < quota; q++) {
    var tweet = "";
    for (var k = 1; k < list.length; k++) {
      if (tweet.length < p.max) {
        // actual length

        var len = 0;

        for (var l = 0; l < list[k].length; l++) {
          if (typeof list[k][l] !== "undefined") {
            if (list[k][l].length > 0) {
              len = l;
            }
          }
        }

        var word = list[k][Math.floor(Math.random() * (len + 1))];

        // make sure word is not undefined
        if (typeof word != "undefined") {
          if (typeof word != "string") {
            word = JSON.stringify(word);
          }

          var tweaked = word.replace(/\\n/g, "\n");
          tweet = tweet + " " + tweaked;
        }
      }
    }

    if (tweet.length > p.min) {
      return tweet;
    }
  }
}
