function test() {
  var test = "test";

  Logger.log(test.length);
}

/*
  PUSH PRESET TWEETS IN ORDER
*/

function getSequentialText(count) {
  var rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("sequential")
    .getDataRange();
  var values = rows.getValues();
  var numRows = rows.getNumRows();

  var list = new Array();

  for (var r = 4; r < numRows; r++) {
    list.push(values[r]);
  }

  return list;
}

/*
  PUSH TWEETS IN RANDOM ORDER
*/

function getSequentialText(count) {
  var rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("sequential")
    .getDataRange();
  var values = rows.getValues();
  var numRows = rows.getNumRows();

  values.splice(0, 4);

  var list = new Array();

  for (var r = 0; r < numRows; r++) {
    var RandNum = Math.floor(Math.random() * values.length);
    var NewTweet = values[RandNum];
    values.splice(RandNum, 1);

    list.push();
  }

  return list;
}
