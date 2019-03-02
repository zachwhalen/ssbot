var tweet = "";
var tweetArray = [];

function updateSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Settings")
    .getRange("b4:b15")
    .getValues();
  var scriptProperties = PropertiesService.getScriptProperties();

  scriptProperties
    .setProperty("constructor", ss[0].toString())
    .setProperty("timing", ss[1].toString())
    .setProperty("min", ss[2].toString())
    .setProperty("max", ss[3].toString())
    .setProperty("img", ss[6].toString())
    .setProperty("depth", ss[7].toString())
    .setProperty("removeHashes", ss[9].toString())
    .setProperty("removeMentions", ss[10].toString())
    .setProperty("everyFail", ss[11].toString());

  var quietStart = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Settings")
    .getRange("b8")
    .getValue()
    .getHours();
  var quietStop = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Settings")
    .getRange("b9")
    .getValue()
    .getHours();

  scriptProperties
    .setProperty("quietStart", quietStart)
    .setProperty("quietEnd", quietStop);

  var callbackURL =
    "https://script.google.com/macros/d/" +
    ScriptApp.getScriptId() +
    "/usercallback";
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Setup")
    .getRange("b17")
    .setValue(callbackURL);
}

function everyRotate() {
  var everySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "Every"
  );
  var lastRow = everySheet.getLastRow();
  // var nextLastRow = lastRow + 1;

  var indexColumn = everySheet.getRange("a" + 1 + ":a" + lastRow).getValues();

  var activeRow = 3;
  for (var i = 0; i < lastRow; i++) {
    if (indexColumn[i][0].match(/next/i)) {
      activeRow = i + 1;
    }
  }
  var nextRow = activeRow + 1;
  everySheet.getRange("a" + activeRow).setValue("");
  everySheet.getRange("a" + nextRow).setValue("next-->");
}

function preview() {
  var properties = PropertiesService.getScriptProperties().getProperties();

  // set up and clear preview sheet
  var previewSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "Preview"
  );
  previewSheet.getRange("b4:b20").setValue(" ");
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(previewSheet);

  switch (properties.constructor) {
    case "sequential":
      var textFunction = getSequentialText;
      break;
    // case "random":
    //   var textFunction = getRandomText;
    //   break;
    default:
      Logger.log(
        "I don't know what happened, but I can't figure out what sort of text to generate."
      );
  }

  for (var p = 0; p < 16; p++) {
    var offset = p + 5;
    var prv = textFunction(10); // change this value if you want more or less preview output
    previewSheet.getRange("b" + offset).setValue(prv);
  }
}

function setTiming() {
  var properties = PropertiesService.getScriptProperties().getProperties();

  // clear any existing triggers
  clearTiming();

  switch (properties.timing) {
    case "12 hours":
      var trigger = ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyHours(12)
        .create();
      break;
    case "8 hours":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyHours(8)
        .create();
      break;
    case "6 hours":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyHours(6)
        .create();
      break;
    case "4 hours":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyHours(4)
        .create();
      break;
    case "2 hours":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyHours(2)
        .create();
      break;
    case "1 hour":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyHours(1)
        .create();
      break;
    case "30 minutes":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyMinutes(30)
        .create();
      break;
    case "20 minutes":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyMinutes(20)
        .create();
      break;
    case "15 minutes":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyMinutes(15)
        .create();
      break;
    case "10 minutes":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyMinutes(10)
        .create();
      break;
    case "5 minutes":
      ScriptApp.newTrigger("sendSingleTweet")
        .timeBased()
        .everyMinutes(5)
        .create();
      break;
    default:
      Logger.log("I couldn't figure out what interval to set.");
  }

  Logger.log(trigger);
}

function clearTiming() {
  // clear any existing triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

/*

  ADD THE "BOT" MENU

*/

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  //  ui.createMenu('Bot')
  //      .addItem('Generate Preview', 'preview')
  //      .addSeparator()
  //      .addItem('Send a Test Tweet', 'sendSingleTweet')
  //      .addItem('Revoke Twitter Authorization', 'authorizationRevoke')
  //      .addSeparator()
  //      .addItem('Start Posting Tweets', 'setTiming')
  //      .addItem('Stop Posting Tweets', 'clearTiming')
  //      .addToUi();

  ui.createMenu("Bot")
    .addItem("Authorize with Twitter", "sendSingleTweet")
    .addItem("Revoke Twitter Authorization", "authorizationRevoke")
    .addSeparator()
    .addItem("Generate Preview", "preview")
    .addItem("Send a Test Tweet", "sendSingleTweet")
    .addSeparator()
    .addItem("Start Scheduled Posts", "setTiming")
    .addItem("Stop Scheduled Posts", "clearTiming")
    .addSeparator()
    .addItem("Clear Log", "clearLog")
    .addToUi();

  // add callback URL
  var callbackURL =
    "https://script.google.com/macros/d/" +
    ScriptApp.getScriptId() +
    "/usercallback";
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Setup")
    .getRange("b17")
    .setValue(callbackURL);

  updateSettings();
}

function clearLog() {
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");
  var lastRow = logSheet.getLastRow();
  var clearRange = logSheet.getRange("a2:d" + lastRow).clearContent();
}

function getTwitterService() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Setup");
  var twitter_name = sheet.getRange("b9").getValue();
  var consumer_key = sheet.getRange("b24").getValue();
  var consumer_secret = sheet.getRange("b27").getValue();
  //var project_key = sheet.getRange('b32').getValue();
  var project_key = ScriptApp.getScriptId();

  // var service = OAuth1.createService('twitter');
  var service = Twitterlib.createService("twitter");
  service.setAccessTokenUrl("https://api.twitter.com/oauth/access_token");

  service.setRequestTokenUrl("https://api.twitter.com/oauth/request_token");

  service.setAuthorizationUrl("https://api.twitter.com/oauth/authorize");
  service.setConsumerKey(consumer_key);
  service.setConsumerSecret(consumer_secret);
  service.setProjectKey(project_key);
  service.setCallbackFunction("authCallback");
  service.setPropertyStore(PropertiesService.getScriptProperties());

  return service;
}

function authCallback(request) {
  var service = getTwitterService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput("Success! You can close this page.");
  } else {
    return HtmlService.createHtmlOutput("Denied. You can close this page");
  }
}

function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*&]/g, function(c) {
    return "%" + c.charCodeAt(0).toString(16);
  });
}

function authorizationRevoke() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty("oauth1.twitter");
  msgPopUp(
    '<p>Your Twitter authorization credentials have been deleted. You\'ll need to re-run "Send a Test Tweet" to reauthorize before you can start posting again.'
  );
}

/*
 * This is the function that finds a single tweet and passes it on to be sent out.
 * I suppose this could be combined with the preview-generation function but hey I have other stuff to do.
 */

function generateTweets() {
  var properties = PropertiesService.getScriptProperties().getProperties();

  switch (properties.constructor) {
    case "sequential":
      var textFunction = getSequentialText;
      break;
    case "random":
      var textFunction = getRandomText;
      break;
    default:
      Logger.log(
        "I don't know what happened, but I can't figure out what sort of text to generate."
      );
  }

  tweetArray = textFunction();

  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("IgnoreMe")
    .getRange(1, 1, tweetArray.length, 1)
    .setValues(tweetArray);

  return tweetArray;
}

function getNextTweet() {
  tweet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("IgnoreMe")
    .getRange("a1")
    .getValue();

  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("IgnoreMe")
    .deleteRow(1);

  tweet = tweet.toString();

  return tweet;
}

function sendSingleTweet() {
  if (curfew()) {
    console.log("CURFEW IN EFFECT!!!");
    return;
  }

  var properties = PropertiesService.getScriptProperties().getProperties();

  tweet = getNextTweet();

  if (tweet.length < properties.min) {
    tweetArray = generateTweets();
    tweet = getNextTweet();
  }

  console.log("LINE 345 " + tweet);

  if (typeof tweet != "undefined" && tweet.length > properties.min) {
    if (properties.removeMentions == "yes") {
      tweet = tweet.replace(/@[a-zA-Z0-9_]+/g, "");
    }
    if (properties.removeHashes == "yes") {
      tweet = tweet.replace(/#[a-zA-Z0-9_]+/g, "");
    }
    while (tweet.match(/ {2}/g)) {
      tweet = tweet.replace(/ {2}/, " ");
    }
    doTweet(tweet);
  } else {
    Logger.log("Too $hort, or some other problem.");
    Logger.log(tweet);
  }
}

function curfew() {
  var properties = PropertiesService.getScriptProperties().getProperties();

  // check the time

  var time = new Date();
  var hour = time.getHours();

  console.log("HOURS =============" + hour);

  var quietBegin = properties.quietStart;
  var quietEnd = properties.quietEnd;

  if (quietBegin == quietEnd) {
    return false;
  }

  if (quietEnd > quietBegin) {
    if ((hour >= quietBegin) & (hour < quietEnd)) {
      Logger.log("Quiet hours");

      console.log("NO TWEETING. GO TO BED. LINE 383");
      return true;
    }
  } else {
    if ((hour >= quietBegin) | (hour < quietEnd)) {
      Logger.log("Quiet hours");

      console.log("NO TWEETING. GO TO BED. LINE 389");
      return true;
    }
  }

  return false;
}

function getMediaIds(tweet) {
  //var tweet = 'Testing http://i.imgur.com/AsghXmB.png http://i.imgur.com/Di9t0XB.jpg';

  var urls = tweet.match(/https?:.*?(\.png|\.jpg|\.gif)/g);

  if (urls.length > 0) {
    var media = [];
    for (var u = 0; u < urls.length; u++) {
      var service = getTwitterService();

      if (service.hasAccess()) {
        var snek = getSnek(urls[u]);
        var mediaPayload = { media_data: snek };

        var parameters = {
          method: "post",
          payload: mediaPayload
        };
        var result = service.fetch(
          "https://upload.twitter.com/1.1/media/upload.json",
          parameters
        );
        var response = JSON.parse(result.getContentText());
        media.push(response.media_id_string);
      } else {
        var authorizationUrl = service.authorize();
        //msgPopUp("<iframe src='" + authorizationUrl + "&output=embed' width='600' height='500'></iframe>");
        msgPopUp(
          '<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' +
            authorizationUrl +
            '">' +
            authorizationUrl +
            "</a></p>"
        );
      }
    }
  } else {
    return []; // this is probably unnecessary
  }

  Logger.log(media);
  return media.join(",");
}

/*
  Do the actual sending of a single tweet.
*/

function doTweet(tweet) {
  var properties = PropertiesService.getScriptProperties().getProperties();

  // if Image URL attaching is on, and one or more are found, pass the tweet to a function that will do the upload and
  // return an array of media_ids

  if (properties.img == "yes" && tweet.match(/\.jpg|\.gif|\.png/)) {
    var media = getMediaIds(tweet);
    tweet = tweet.replace(/https?:.*?(\.png|\.jpg|\.gif)/g, "");
  }

  var service = getTwitterService();

  if (service.hasAccess()) {
    if (typeof media != "undefined" && media.length > 0) {
      var payload = { status: tweet, media_ids: media };
    } else {
      var payload = { status: tweet };
    }
  } else {
    var authorizationUrl = service.authorize();
    msgPopUp(
      '<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' +
        authorizationUrl +
        '">' +
        authorizationUrl +
        "</a></p>"
    );
  }

  var parameters = {
    method: "post",
    payload: payload
  };

  try {
    var result = service.fetch(
      "https://api.twitter.com/1.1/statuses/update.json",
      parameters
    );
    Logger.log(result.getContentText());
    var response = JSON.parse(result.getContentText());

    if (response.created_at && properties.constructor === "every") {
      everyRotate();
    }

    doLog(response, tweet, "Success");
  } catch (e) {
    Logger.log(e.toString());
    doLog(e, "n/a", "Error");
    if (properties.constructor === "every") {
      if (properties.everyFail === "skip") {
        everyRotate();
      }
    }
  }
}

function msgPopUp(msg) {
  var content =
    '<div style="font-family: Verdana;font-size: 22px; text-align:left; width: 80%; margin: 0 auto;">' +
    msg +
    "</div>";
  var htmlOutput = HtmlService.createHtmlOutput(content)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setWidth(600)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, " ");
}

function onEdit(e) {
  updateSettings();
}

function doLog(msg, tweet, status) {
  var d = new Date();

  var currentTime = d.toLocaleTimeString();

  var ls = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("log");
  // var logVals = new Array();
  var logVals = [[currentTime, status, tweet, msg]];

  ls.insertRowBefore(2);
  ls.getRange("A2:D2").setValues(logVals);
}

function getSnek(imgUrl) {
  var response = UrlFetchApp.fetch(imgUrl);

  var result = response.getContent();
  return Utilities.base64Encode(result);
}
