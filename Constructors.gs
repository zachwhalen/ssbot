
function test() {
  var test = "test";

  Logger.log(test.length);
}

function getEbooksText(count) {

  var p = PropertiesService.getScriptProperties().getProperties();
  var tweets = new Array();

  if (typeof count !== 'undefined') {
    var quota = count;
  } else {
    var quota = 1;
  }


  var tagsUrl = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_ebooks").getRange('b15').getValues();
  var tagSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_ebooks").getRange('b20').getValues()[0][0];
  var tagRange = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_ebooks").getRange('b23').getValues();


  var tagss = SpreadsheetApp.openByUrl(tagsUrl);

  if (tagSheet.length == 0) {
    tagSheet = "Sheet1";
  }

  //var ss = tagss.getSheetByName(tagSheet);
  Logger.log(tagSheet);
  var lastRow = tagss.getSheetByName(tagSheet).getLastRow();

  var tweets = [];
  var beginnings = [];
  var endings = [];
  var data = new Object();

  // gather some tweets
  //
  var allTweets = tagss.getSheetByName(tagSheet).getRange(tagRange + "2:" + tagRange + lastRow).getValues();

  for (var z = 0; z < allTweets.length; z++) {
    // Logger.log(allTweets[z]);

    var tweet = allTweets[z][0];

    // remove links and 'RT'
    var twt = tweet.replace(/https?:\/\/t\.co\/[a-z0-9]+/ig, '').replace(/RT :?/, '');

    // check whether to remove hashtags 
    var stripTags = p.removeHashes;
    var stripAts = p.removeMentions;

    if (stripTags === "yes") {
      twt = twt.replace(/#[a-zA-Z0-9_]+/g, '').replace(/RT :/, '');
    }

    if (stripAts === "yes") {
      twt = twt.replace(/@[a-zA-Z0-9_]+/g, '').replace(/RT :?/, '');
    }

    twt = twt.replace(/^[ :]*/, '').replace(/ {2}/g, ' ');
    var asList = twt.split(/[ |\n]/);

    // build a list of beginnings and endings
    //    beginnings.push(asList[0]);


    var b = asList[0];
    for (var d = 1; d < p.depth; d++) {
      if (typeof asList[d] !== 'undefined') {
        b = b + " " + asList[d];
      }
    }
    beginnings.push(b);

    var end = '';// asList[ asList.length - 1 ];

    for (var d = asList.length; d > asList.length - p.depth; d--) {
      if (typeof asList[d] !== 'undefined') {
        end = asList[d] + " " + end;
      }
    }

    end = end.replace(/ *$/, '');
    endings.push(end);
    //Logger.log(beginnings);
    // push the words into the data structure
    for (var t = 0; t < asList.length - p.depth; t++) {

      var branch = new Array();
      for (var d = 0; d < p.depth; d++) {

        branch.push(asList[t - d]);
      }
      var thisIn = branch.reverse().join(" ");

      var thisOut = asList[t + 1];

      if (typeof data[thisIn] == 'object') {
        if (thisOut.length > 0 & typeof thisOut !== 'undefined') {
          data[thisIn].push(thisOut);
        }
      } else {
        data[thisIn] = new Array();
        if (thisOut.length > 0 & typeof thisOut !== 'undefined') {
          data[thisIn].push(thisOut);
        }
      }
    }
  }


  // build it
  for (var q = 0; q < quota; q++) {

    var tries = 0;
    while (tries < 100) {

      var seed = Math.floor(Math.random() * beginnings.length);

      var msg = beginnings[seed].replace(/^ /, '');
      var dead = false;
      while (msg.length < p.max & dead === false) {
        var sofar = msg.split(" ");

        //var trunk = sofar[sofar.length - 1];
        var build = new Array();
        //Logger.log(sofar);
        //Logger.log(sofar.length);
        if (sofar.length == p.depth) {
          var trunk = sofar.join(" ");
        } else {
          for (var d = 1; d <= p.depth; d++) {
            build.push(sofar[sofar.length - d]);
          }
          var trunk = build.reverse().join(" ");
        }



        if (typeof data[trunk] !== 'undefined' & endings.indexOf(trunk) < 0) {
          var branch = data[trunk][Math.floor((Math.random() * data[trunk].length))];
          if (typeof branch !== 'undefined') { msg = msg + " " + branch; } else { dead = true; }
        } else {
          dead = true;
        }
      }

      //Logger.log(firsts);
      if (msg.length > p.min) {
        tweets.push(msg);
        tries = 101;
      } else {
        tries += 1;
      }
    }
  }
  return tweets;
}

function oldEveryText(count) {

  if (typeof count !== 'undefined') {
    var quota = count;
  } else {
    var quota = 1;
  }

  var everySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('every');
  var activeRow = 3;
  var tweet = everySheet.getRange("b" + activeRow + ":z" + activeRow).getValues()[0].join(' ');

  tweet.replace('  ', ' ');

  if (!tweet.match(/\*\*\*STOP\*\*\*/)) {
    return tweet;
  }

}

function getEveryText(count) {
  var p = PropertiesService.getScriptProperties().getProperties();
  var tweets = new Array();
  if (typeof count !== 'undefined') {
    var quota = count;
  } else {
    var quota = 1;
  }

  var everySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('every');
  var lastRow = everySheet.getLastRow();
  var indexColumn = everySheet.getRange("a" + 1 + ":a" + lastRow).getValues();

  var activeRow = 3;
  for (var i = 0; i < lastRow; i++) {
    if (indexColumn[i][0].match(/next/i)) {
      activeRow = i + 1;
    }
  }

  var tempLastRow = lastRow - 2;
  for (i = (activeRow - 3); i < (activeRow - 3) + quota; i++) {
    var temp = (i % tempLastRow) + 3;

    var tweet = everySheet.getRange("b" + temp + ":z" + temp).getValues()[0].join(' ');

    if (!tweet.match(/\*\*\*STOP\*\*\*/)) {
      tweets.push(tweet);
    } else {
      break; //Stop finding more records due to stop condition
    }
  }
  return tweets;
}

function getScheduledText(count, preview) {
  var p = PropertiesService.getScriptProperties().getProperties();
  var tweets = new Array();
  if (typeof count !== 'undefined') {
    var quota = count;
  } else {
    var quota = 1;
  }

  var scheduledSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('scheduled');
  var scheduledData = scheduledSheet.getRange("a" + 4 + ":c" + scheduledSheet.getLastRow()).getValues();
  var lastRow = scheduledData.length;
  var fudgeFactor = 15;         //Number of minutes before and after now to consider equivalent to now.
  fudgeFactor += getTiming();   //Also add the time between runs to the fudge factor.
  var now = new Date();
  var beforeNow = new Date(now.getTime() - fudgeFactor*60000);
  var afterNow = new Date(now.getTime() + fudgeFactor*60000);

  //Wipe out wrong "Actual Tweet Time"
  for (i = 0; i < lastRow; i++) {
    scheduledData[i].push(i + 4);
    if (scheduledData[i][0] > 0 &&
        (scheduledData[i][0] < scheduledData[i][1] //Desired date is newer that Actual Date (most likely due to repeating desired date)
        || scheduledData[i][0] > afterNow)) {     //Actual date is in the future
      scheduledData[i][0] = "";
      scheduledSheet.getRange("a" + (i + 4)).setValue("");
    }
    if (scheduledData[i][1] < beforeNow || scheduledData[i][0] > 0) {  //Erase tweets that are already sent or in the past
      scheduledData[i][1] = "";
      scheduledData[i][2] = "";
    }
  }

  //Sort tweets by time
  scheduledData.sort(function(a,b){ return a[1] - b[1]; });

  //Find tweets to return
  var found = 0;
  if (preview) {
    for (i = 0; i < lastRow; i++) {
        if (scheduledData[i][2] != "" && found++ < quota) {
          tweets.push(scheduledData[i][2]);
        }
      }
  } else {
    for (i = 0; i < lastRow; i++) {
      if (scheduledData[i][2] != ""           //Tweet is not empty
          && scheduledData[i][1] < afterNow   //Tweet is not to far in the future
          && found++ < quota) {               //We don't have too many tweets already
        tweets.push([scheduledData[i][2], scheduledData[i][3]]);
      }
  }
}
  return tweets;
}


function getMarkovText(count) {

  var p = PropertiesService.getScriptProperties().getProperties();
  var tweets = new Array();

  if (typeof count !== 'undefined') {
    var quota = count;
  } else {
    var quota = 1;
  }

  // Tuning
  var depth = p.depth;
  var exclTitles = /Mr|Mrs|Ms|Dr|Jr/ig;
  var stripQuotes = 1;

  // grab the appropriate spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('markov');

  // get all the text, from b5 and following
  var range = sheet.getRange('b5:b' + sheet.getLastRow());
  var txt = range.getValues().join(" ").replace(/\"/ig, '').replace("  ", " ").split(" ");

  // make words into data
  var data = new Object();
  var firsts = new Array();
  var lasts = new Array();
  for (var i = 0; i < txt.length - 1; i++) {

    if (/[A-ZА-Я]/.test(txt[i][0])) {

      var thisFirst = new Array();
      for (var d = 0; d < depth; d++) {
        thisFirst += " " + txt[i + d];
      }

      firsts.push(thisFirst);
    }

    if (/[\.|\?]"?$/.test(txt[i]) & !txt[i].match(exclTitles)) {
      if (firsts.indexOf(txt[i]) < 0) {
        //lasts.push(txt[i]); 
        var thisLast = new Array();
        for (var d = 0; d < depth; d++) {
          thisLast.push(txt[i - d]);
        }
        var thisL = thisLast.reverse().join(" ");
        lasts.push(thisL);
      }
    }
    var thisIn;
    var thisOut;
    var branch = new Array();
    for (var d = 0; d < depth; d++) {

      branch.push(txt[i - d]);
    }
    var thisIn = branch.reverse().join(" ");

    var thisOut = txt[i + 1];

    if (typeof data[thisIn] == 'object') {
      if (thisOut.length > 0) {
        data[thisIn].push(thisOut);
      }
    } else {
      data[thisIn] = new Array();
      if (thisOut.length > 0) {
        data[thisIn].push(thisOut);
      }
    }
  }

  //Logger.log(data);

  // return;

  // build it

  //var seed = Math.floor((Math.random() * Object.keys(data).length) + 1);

  for (var q = 0; q < quota; q++) {

    var seed = Math.floor(Math.random() * firsts.length);

    var msg = firsts[seed].replace(/^ /, '');
    var dead = false;
    while (msg.length < p.max & dead === false) {
      var sofar = msg.split(" ");

      //var trunk = sofar[sofar.length - 1];
      var build = new Array();
      //Logger.log(sofar);
      //Logger.log(sofar.length);
      if (sofar.length == depth) {
        var trunk = sofar.join(" ");
      } else {
        for (var d = 1; d <= depth; d++) {
          build.push(sofar[sofar.length - d]);
        }
        var trunk = build.reverse().join(" ");
      }

      //Logger.log(trunk);


      if (typeof data[trunk] !== 'undefined' & lasts.indexOf(trunk) < 0) {
        var branch = data[trunk][Math.floor((Math.random() * data[trunk].length))];
        if (typeof branch !== 'undefined') { msg = msg + " " + branch; } else { dead = true; }
      } else {
        dead = true;
      }
    }

    //Logger.log(firsts);
    if (msg.length > p.min) {
      tweets.push(msg);
    }
  }
  return tweets;
}

function getXYText(count) {

  var p = PropertiesService.getScriptProperties().getProperties();
  var tweets = new Array();
  if (typeof count !== 'undefined') {
    var quota = count;
  } else {
    var quota = 1;
  }

  for (i = 0; i < quota; i++) {
    var half = (p.max / 2) - 10;

    var xySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("x + y");
    var lastRow = xySheet.getLastRow();
    var xBucket = xySheet.getRange("b4:b" + lastRow).getValues().join(" ").replace(/\n/g, '');
    var yBucket = xySheet.getRange("c4:c" + lastRow).getValues().join(" ").replace(/\n/g, '');
    var leftRE = /[.?!;] ([A-Z][^.;?]+?) (and|or|but)/g;
    var rightRE = /(and|or|but) ([^.;?]+?[.;?])/g;
    var left;
    var xLefts = new Array();
    var yLefts = new Array();
    var right;
    var xRights = new Array();
    var yRights = new Array();

    do {
      left = leftRE.exec(xBucket);
      if (left) {
        if (left[1].length < half) {
          xLefts.push(left[1]);
        }
      }
    } while (left);

    do {
      left = leftRE.exec(yBucket);
      if (left) {
        if (left[1].length < half) {
          yLefts.push(left[1]);
        }
      }
    } while (left);

    do {
      right = rightRE.exec(xBucket);
      if (right) {
        if (right[2].length < half) {
          xRights.push(right[2]);
        }
      }
    } while (right);

    do {
      right = rightRE.exec(yBucket);
      if (right) {
        if (right[2].length < half) {
          yRights.push(right[2]);
        }
      }
    } while (right);


    var msg = '';
    var dice = Math.floor((Math.random() * 10));
    var conjunctions = ['and', 'or', 'but', 'yet', 'however'];
    if (dice < 5) {
      msg += xLefts[Math.floor((Math.random() * xLefts.length))];
      msg += ", " + conjunctions[Math.floor((Math.random() * conjunctions.length))] + " ";
      msg += yRights[Math.floor((Math.random() * yRights.length))];

    } else {
      msg += yLefts[Math.floor((Math.random() * yLefts.length))];
      msg += ", " + conjunctions[Math.floor((Math.random() * conjunctions.length))] + " ";
      msg += xRights[Math.floor((Math.random() * xRights.length))];

    }


    msg = msg.replace(",,", ",");
    if (msg.length < p.max) {
      tweets.push(msg);
    }
  }
  return tweets;
}

/*
 
 GENERATE TWEETS BY SELECTING ONE CELL FROM EACH COLUMN
 
*/

function getColumnSelectText(count) {

  var p = PropertiesService.getScriptProperties().getProperties();
  var tweets = new Array();

  if (typeof count !== 'undefined') {
    var quota = count;
  } else {
    var quota = 1;
  }

  var rows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("columns").getDataRange();
  var values = rows.getValues();
  var numRows = rows.getNumRows();
  var numCols = rows.getNumColumns();

  var list = new Array();

  for (var r = 4; r < numRows; r++) {

    var thisRow = values[r];

    for (var c = 1; c < numCols; c++) {

      if (typeof thisRow[c] !== 'undefined') {
        if (typeof list[c] == 'undefined') {
          list[c] = new Array();
        }
        list[c].push(thisRow[c]);
      }

    }
  }


  for (var q = 0; q < quota; q++) {
    var tweet = '';
    for (var k = 1; k < list.length; k++) {
      if (tweet.length < p.max) {

        // actual length

        var len = 0;

        for (var l = 0; l < list[k].length; l++) {
          if (typeof list[k][l] !== 'undefined') {
            if (list[k][l].length > 0) {
              len = l;
            }
          }
        }

        var word = list[k][Math.floor(Math.random() * (len + 1))];

        // make sure word is not undefined
        if (typeof (word) != 'undefined') {

          if (typeof (word) != 'string') {
            word = JSON.stringify(word);
          }

          var tweaked = word.replace(/\\n/g, "\n");
          tweet = tweet + " " + tweaked;
        }
      }
    }


    if (tweet.length > p.min) {
      tweets.push(tweet);
    }
  }
  return tweets
}

/*
 
 MAKE TWEETS BY SELECTING ONE CELL FROM EACH ROW
 
*/

function getRowSelectText(count) {

  var p = PropertiesService.getScriptProperties().getProperties();
  var tweets = new Array();

  if (typeof count !== 'undefined') {
    var quota = count;
  } else {
    var quota = 1;
  }
  // select one cell from each row

  var rows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("rows").getDataRange();
  var values = rows.getValues();
  var numRows = rows.getNumRows();
  var list = new Array();

  for (var i = 4; i <= numRows - 1; i++) {
    var row = values[i];
    list[i] = new Array();

    // find the actual limit of this row
    var len = 0;
    for (var j = 1; j <= row.length; j++) {
      if (row[j]) {
        list[i][j] = row[j];
      }
    }
  }


  for (var q = 0; q < quota; q++) {
    var tweet = '';
    for (var k = 4; k < list.length; k++) {
      if (tweet.length < p.max) {
        // Logger.log(list[k]);
        var word = list[k][Math.floor(Math.random() * (list[k].length - 1)) + 1];

        // make sure word is not undefined
        if (typeof (word) != 'undefined') {

          if (typeof (word) != 'string') {
            word = JSON.stringify(word);
          }

          var tweaked = word.replace(/\\n/g, "\n");
          tweet = tweet + " " + tweaked;
        }

      }
    }

    if (tweet.length > p.min) {
      tweets.push(tweet);
    }

  }
  return tweets
} 

function getTiming() {
  var properties = PropertiesService.getScriptProperties().getProperties();
  var timing = 0;
  switch (properties.timing) {
    case "12 hours":
      timing = 12*60;
      break;
    case "8 hours":
      timing = 8*60;
      break;
    case "6 hours":
      timing = 6*60;
      break;
    case "4 hours":
      timing = 4*60;
      break;
    case "2 hours":
      timing = 2*60;
      break;
    case "1 hour":
     timing = 1*60;
      break;
    case "30 minutes":
      timing = 30;
      break;
    case "15 minutes":
      timing = 15;
      break;
    case "10 minutes":
      timing = 10;
      break;
    case "5 minutes":
      timing = 5;
      break;
    default:
      timing = 0;
  }
  return timing;
}