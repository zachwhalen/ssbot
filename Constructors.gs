function test() {
  var test = "test";

  Logger.log(test.length);
}

/*
  PUSH PRESET TWEETS IN ORDER
*/

function getSequentialText(count) {
  var p = PropertiesService.getScriptProperties().getProperties();

  var rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("sequential")
    .getDataRange();
  var values = rows.getValues();
  var numRows = rows.getNumRows();

  var list = new Array();

  for (var r = 4; r < numRows; r++) {
    list.push(values[r]);
    // console.log("CONSTRUCTORS LINE 454" + values[r]);
  }
  return list;
}
