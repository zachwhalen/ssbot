/*
 PUSH PRESET TWEETS IN ORDER
*/

function getColumnSelectText(count) {
  var p = PropertiesService.getScriptProperties().getProperties();

  var rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("columns")
    .getDataRange();
  var values = rows.getValues();
  var numRows = rows.getNumRows();

  var list = new Array();

  for (var r = 4; r < numRows; r++) {
    list.push(values[r]);
    console.log(values[r]);
  }
  return list;
}
