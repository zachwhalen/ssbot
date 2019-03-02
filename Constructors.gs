function test() {
  var test = "test";

  Logger.log(test.length);
}

function getEbooksText(count) {
  var p = PropertiesService.getScriptProperties().getProperties();

  if (typeof count !== "undefined") {
    var quota = count;
  } else {
    var quota = 1;
  }

  var tagsUrl = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("_ebooks")
    .getRange("b15")
    .getValues();
  var tagSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("_ebooks")
    .getRange("b20")
    .getValues()[0][0];
  var tagRange = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("_ebooks")
    .getRange("b23")
    .getValues();

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
  var allTweets = tagss
    .getSheetByName(tagSheet)
    .getRange(tagRange + "2:" + tagRange + lastRow)
    .getValues();

  for (var z = 0; z < allTweets.length; z++) {
    // Logger.log(allTweets[z]);

    var tweet = allTweets[z][0];

    // remove links and 'RT'
    var twt = tweet
      .replace(/https?:\/\/t\.co\/[a-z0-9]+/gi, "")
      .replace(/RT :?/, "");

    // check whether to remove hashtags
    var stripTags = p.removeHashes;
    var stripAts = p.removeMentions;

    if (stripTags === "yes") {
      twt = twt.replace(/#[a-zA-Z0-9_]+/g, "").replace(/RT :/, "");
    }

    if (stripAts === "yes") {
      twt = twt.replace(/@[a-zA-Z0-9_]+/g, "").replace(/RT :?/, "");
    }

    twt = twt.replace(/^[ :]*/, "").replace(/ {2}/g, " ");
    var asList = twt.split(/[ |\n]/);

    // build a list of beginnings and endings
    //    beginnings.push(asList[0]);

    var b = asList[0];
    for (var d = 1; d < p.depth; d++) {
      if (typeof asList[d] !== "undefined") {
        b = b + " " + asList[d];
      }
    }
    beginnings.push(b);

    var end = ""; // asList[ asList.length - 1 ];

    for (var d = asList.length; d > asList.length - p.depth; d--) {
      if (typeof asList[d] !== "undefined") {
        end = asList[d] + " " + end;
      }
    }

    end = end.replace(/ *$/, "");
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

      if (typeof data[thisIn] == "object") {
        if ((thisOut.length > 0) & (typeof thisOut !== "undefined")) {
          data[thisIn].push(thisOut);
        }
      } else {
        data[thisIn] = new Array();
        if ((thisOut.length > 0) & (typeof thisOut !== "undefined")) {
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

      var msg = beginnings[seed].replace(/^ /, "");
      var dead = false;
      while ((msg.length < p.max) & (dead === false)) {
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

        if (
          (typeof data[trunk] !== "undefined") &
          (endings.indexOf(trunk) < 0)
        ) {
          var branch =
            data[trunk][Math.floor(Math.random() * data[trunk].length)];
          if (typeof branch !== "undefined") {
            msg = msg + " " + branch;
          } else {
            dead = true;
          }
        } else {
          dead = true;
        }
      }

      //Logger.log(firsts);
      if (msg.length > p.min) {
        return msg;
        tries = 101;
      } else {
        tries += 1;
      }
    }
  }
}

function oldEveryText(count) {
  if (typeof count !== "undefined") {
    var quota = count;
  } else {
    var quota = 1;
  }

  var everySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "every"
  );
  var activeRow = 3;
  var tweet = everySheet
    .getRange("b" + activeRow + ":z" + activeRow)
    .getValues()[0]
    .join(" ");

  tweet.replace("  ", " ");

  if (!tweet.match(/\*\*\*STOP\*\*\*/)) {
    return tweet;
  }
}

function getEveryText(count) {
  var p = PropertiesService.getScriptProperties().getProperties();
  if (typeof count !== "undefined") {
    var quota = count;
  } else {
    var quota = 1;
  }

  var everySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "every"
  );
  var lastRow = everySheet.getLastRow();
  var indexColumn = everySheet.getRange("a" + 1 + ":a" + lastRow).getValues();

  var activeRow = 3;
  for (var i = 0; i < lastRow; i++) {
    if (indexColumn[i][0].match(/next/i)) {
      activeRow = i + 1;
    }
  }

  var tweet = everySheet
    .getRange("b" + activeRow + ":z" + activeRow)
    .getValues()[0]
    .join(" ");

  if (!tweet.match(/\*\*\*STOP\*\*\*/)) {
    return tweet;
  }
}

function getMarkovText(count) {
  var p = PropertiesService.getScriptProperties().getProperties();

  // Tuning
  var depth = p.depth;
  var exclTitles = /Mr|Mrs|Ms|Dr|Jr/gi;
  var stripQuotes = 1;

  if (typeof count !== "undefined") {
    var quota = count;
  } else {
    var quota = 1;
  }

  // grab the appropriate spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("markov");

  // get all the text, from b5 and following
  var range = sheet.getRange("b5:b" + sheet.getLastRow());
  var txt = range
    .getValues()
    .join(" ")
    .replace(/\"/gi, "")
    .replace("  ", " ")
    .split(" ");

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

    if (typeof data[thisIn] == "object") {
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

    var msg = firsts[seed].replace(/^ /, "");
    var dead = false;
    while ((msg.length < p.max) & (dead === false)) {
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

      if ((typeof data[trunk] !== "undefined") & (lasts.indexOf(trunk) < 0)) {
        var branch =
          data[trunk][Math.floor(Math.random() * data[trunk].length)];
        if (typeof branch !== "undefined") {
          msg = msg + " " + branch;
        } else {
          dead = true;
        }
      } else {
        dead = true;
      }
    }

    //Logger.log(firsts);
    if (msg.length > p.min) {
      return msg;
    }
  }
}

function getXYText() {
  var p = PropertiesService.getScriptProperties().getProperties();

  var half = p.max / 2 - 10;

  var xySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("x + y");
  var lastRow = xySheet.getLastRow();
  var xBucket = xySheet
    .getRange("b4:b" + lastRow)
    .getValues()
    .join(" ")
    .replace(/\n/g, "");
  var yBucket = xySheet
    .getRange("c4:c" + lastRow)
    .getValues()
    .join(" ")
    .replace(/\n/g, "");
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

  var msg = "";
  var dice = Math.floor(Math.random() * 10);
  var conjunctions = ["and", "or", "but", "yet", "however"];
  if (dice < 5) {
    msg += xLefts[Math.floor(Math.random() * xLefts.length)];
    msg +=
      ", " +
      conjunctions[Math.floor(Math.random() * conjunctions.length)] +
      " ";
    msg += yRights[Math.floor(Math.random() * yRights.length)];
  } else {
    msg += yLefts[Math.floor(Math.random() * yLefts.length)];
    msg +=
      ", " +
      conjunctions[Math.floor(Math.random() * conjunctions.length)] +
      " ";
    msg += xRights[Math.floor(Math.random() * xRights.length)];
  }

  msg = msg.replace(",,", ",");
  if (msg.length < p.max) {
    return msg;
  }
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

  console.log("CONSTRUCTORS LINE 457" + typeof list);
  console.log("CONSTRUCTORS LINE 458" + list);
  return list;
}
