/* 

   A Spreadsheet-powered Twitter Bot Engine, version 0.6.0, August 2019
   
   by Zach Whalen (@zachwhalen, zachwhalen.net)
   
   This code powers the backend for a front-end in a google spreadsheet. If somehow 
   you've arrived at this code without the spreadsheet, start by making a copy of that 
   sheet by visiting this URL:
   
     bit.ly/...
   
   All of the setup instructions are available in the sheet or (with pictures!) in 
   this blog post:
   
   http://zachwhalen.net/posts/how-to-make-a-twitter-bot-with-google-spreadsheets-version-04
   
   Use it at your own discretion bearing in mind Twitter's terms of service and Darius 
   Kazemi's "Basic Twitter bot Etiquette": 
   http://tinysubversions.com/2013/03/basic-twitter-bot-etiquette/
   
   This script makes use of Twitter Lib by Bradley Momberger and implements some concepts 
   inspired by or borrowed from Darius Kazemi and Martin Hawksey.

*/

/*  

    MIT License
    
    Copyright (c) 2016 Zach Whalen
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
   
*/

function updateSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings").getRange("b4:b15").getValues();
  var scriptProperties = PropertiesService.getScriptProperties();

  scriptProperties.
    setProperty('constructor', ss[0].toString()).
    setProperty('timing', ss[1].toString()).
    setProperty('min', ss[2].toString()).
    setProperty('max', ss[3].toString()).
    setProperty('img', ss[6].toString()).
    setProperty('depth', ss[7].toString()).
    setProperty('ban', ss[8].toString()).
    setProperty('removeHashes', ss[9].toString()).
    setProperty('removeMentions', ss[10].toString()).
    setProperty('everyFail', ss[11].toString());

  var quietStart = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings").getRange("b8").getValue().getHours();
  var quietStop = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings").getRange("b9").getValue().getHours();

  scriptProperties.setProperty('quietStart', quietStart).setProperty('quietEnd', quietStop);

  var callbackURL = "https://script.google.com/macros/d/" + ScriptApp.getScriptId() + "/usercallback";
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Setup").getRange('b17').setValue(callbackURL);


}

function everyRotate() {

  var everySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Every");
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

function logScheduledTweet(created_at, rowID) {
  var scheduledSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('scheduled');
  scheduledSheet.getRange("a" + rowID + ":a" + rowID).setValue(created_at);
}

function getTweets(count, preview) {
  var properties = PropertiesService.getScriptProperties().getProperties();

  switch (properties.constructor) {
    case "markov":
      var textFunction = getMarkovText;
      break;
    case "rows":
      var textFunction = getRowSelectText;
      break;
    case "columns":
      var textFunction = getColumnSelectText;
      break;
    case "_ebooks":
      var textFunction = getEbooksText;
      break;
    case "every":
      var textFunction = getEveryText;
      break;
    case "scheduled":
      var textFunction = getScheduledText;
      break;
    case "x + y":
      var textFunction = getXYText;
      break;
    default:
      Logger.log("I don't know what happened, but I can't figure out what sort of text to generate.");
  }
  return textFunction(count, preview);
}

function preview() {

  var properties = PropertiesService.getScriptProperties().getProperties();

  // set up and clear preview sheet
  var previewSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Preview");
  previewSheet.getRange('b4:b20').setValue(" ");
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(previewSheet);

  var tweets = getTweets(16, true);

  for (var p = 0; p < tweets.length; p++) {
    var offset = p + 5;
    previewSheet.getRange('b' + offset).setValue(tweets[p]);
  }


}

function setTiming() {

  var properties = PropertiesService.getScriptProperties().getProperties();


  // clear any existing triggers
  clearTiming();

  switch (properties.timing) {
    case "12 hours":
      var trigger = ScriptApp.newTrigger("generateSingleTweet")
        .timeBased()
        .everyHours(12)
        .create();
      break;
    case "8 hours":
      ScriptApp.newTrigger("generateSingleTweet")
        .timeBased()
        .everyHours(8)
        .create();
      break;
    case "6 hours":
      ScriptApp.newTrigger("generateSingleTweet")
        .timeBased()
        .everyHours(6)
        .create();
      break;
    case "4 hours":
      ScriptApp.newTrigger("generateSingleTweet")
        .timeBased()
        .everyHours(4)
        .create();
      break;
    case "2 hours":
      ScriptApp.newTrigger("generateSingleTweet")
        .timeBased()
        .everyHours(2)
        .create();
      break;
    case "1 hour":
      ScriptApp.newTrigger("generateSingleTweet")
        .timeBased()
        .everyHours(1)
        .create();
      break;
    case "30 minutes":
      ScriptApp.newTrigger("generateSingleTweet")
        .timeBased()
        .everyMinutes(30)
        .create();
      break;
    case "15 minutes":
      ScriptApp.newTrigger("generateSingleTweet")
        .timeBased()
        .everyMinutes(15)
        .create();
      break;
    case "10 minutes":
      ScriptApp.newTrigger("generateSingleTweet")
        .timeBased()
        .everyMinutes(10)
        .create();
      break;
    case "5 minutes":
      ScriptApp.newTrigger("generateSingleTweet")
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
  //      .addItem('Send a Test Tweet', 'generateSingleTweet')
  //      .addItem('Revoke Twitter Authorization', 'authorizationRevoke')
  //      .addSeparator()
  //      .addItem('Start Posting Tweets', 'setTiming')
  //      .addItem('Stop Posting Tweets', 'clearTiming')
  //      .addToUi();

  ui.createMenu('Bot')
    .addItem('Authorize with Twitter', 'generateSingleTweet')
    .addItem('Revoke Twitter Authorization', 'authorizationRevoke')
    .addSeparator()
    .addItem('Generate Preview', 'preview')
    .addItem('Send a Test Tweet', 'generateSingleTweet')
    .addSeparator()
    .addItem('Start Scheduled Posts', 'setTiming')
    .addItem('Stop Scheduled Posts', 'clearTiming')
    .addSeparator()
    .addItem('Clear Log', 'clearLog')
    .addToUi();

  // add callback URL  
  var callbackURL = "https://script.google.com/macros/d/" + ScriptApp.getScriptId() + "/usercallback";
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Setup").getRange('b17').setValue(callbackURL);

  updateSettings();
}

function clearLog() {
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");
  var lastRow = logSheet.getLastRow();
  var clearRange = logSheet.getRange("a2:d" + lastRow).clearContent();
}

function getTwitterService() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Setup');
  var twitter_name = sheet.getRange('b9').getValue();
  var consumer_key = sheet.getRange('b24').getValue();
  var consumer_secret = sheet.getRange('b27').getValue();
  //var project_key = sheet.getRange('b32').getValue();
  var project_key = ScriptApp.getScriptId();

  // var service = OAuth1.createService('twitter');
  var service = Twitterlib.createService('twitter');
  service.setAccessTokenUrl('https://api.twitter.com/oauth/access_token');

  service.setRequestTokenUrl('https://api.twitter.com/oauth/request_token');


  service.setAuthorizationUrl('https://api.twitter.com/oauth/authorize');
  service.setConsumerKey(consumer_key);
  service.setConsumerSecret(consumer_secret);
  service.setScriptId(project_key);
  service.setCallbackFunction('authCallback');
  service.setPropertyStore(PropertiesService.getScriptProperties());

  return service;


}

function authCallback(request) {
  var service = getTwitterService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this page.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this page');
  }
}

function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*&]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

function authorizationRevoke() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty('oauth1.twitter');
  msgPopUp('<p>Your Twitter authorization credentials have been deleted. You\'ll need to re-run "Send a Test Tweet" to reauthorize before you can start posting again.');
}

/*
 * This is the function that finds a single tweet and passes it on to be sent out.
*/

function generateSingleTweet() {

  var properties = PropertiesService.getScriptProperties().getProperties();
  
  var temp;
  var tempID;
  if (properties.constructor == "scheduled") {
    var tempArray = getTweets(1000, false); //1,000 tweets will be the maximum number of scheduled tweets that can be sent in a single block of time
    if (typeof tempArray == 'undefined') {
      doLog("Scheduled Tweet: There is nothing to Tweet now","","Nothing");
      Logger.log("Scheduled Tweet: Nothing to tweet in this time block");
      return;
    }
    temp = tempArray.map(function(value,index) { return value[0]; });
    tempID = tempArray.map(function(value,index) { return value[1]; });
  } else {
    temp = getTweets(1, false);
  }
  var tweet;
  for (i = 0; i < temp.length; i++) {
    tweet = temp[i];

    if (typeof tweet != 'undefined' &&
      tweet.length > properties.min &&
      !wordFilter(tweet) &&
      !curfew()) {
      if (properties.removeMentions == 'yes') {
        tweet = tweet.replace(/@[a-zA-Z0-9_]+/g, '');
      }
      if (properties.removeHashes == 'yes') {
        tweet = tweet.replace(/#[a-zA-Z0-9_]+/g, '');
      }
      while (tweet.match(/ {2}/g)) {
        tweet = tweet.replace(/ {2}/, ' ');
      }
      doTweet(tweet, tempID[i]);
    } else {
      Logger.log("Too short, or some other problem.");
      Logger.log(tweet);
      Logger.log("Wordfilter: " + wordFilter(tweet));
    }
  }
}

function curfew() {
  var properties = PropertiesService.getScriptProperties().getProperties();

  // check the time

  var time = new Date();
  var hour = time.getHours();

  var quietBegin = properties.quietStart;
  var quietEnd = properties.quietEnd;

  if (quietBegin == quietEnd) {
    return false;
  }

  if (quietEnd > quietBegin) {
    if (hour >= quietBegin & hour < quietEnd) {
      Logger.log("Quiet hours");
      return true;
    }
  } else {
    if (hour >= quietBegin | hour < quietEnd) {
      Logger.log("Quiet hours");
      return true;
    }
  }

  return false;
}

function getMediaIds(tweet) {

  //var tweet = 'Testing http://i.imgur.com/AsghXmB.png http://i.imgur.com/Di9t0XB.jpg';

  var urls = tweet.match(/https?:[^ ]*?(\.png|\.jpg|\.gif)/gi);

  if (urls.length > 0) {
    var media = [];
    for (var u = 0; u < urls.length; u++) {

      var service = getTwitterService();

      if (service.hasAccess()) {
        var snek = getSnek(urls[u]);
        var mediaPayload = { 'media_data': snek };

        var parameters = {
          method: 'post',
          payload: mediaPayload
        };
        var result = service.fetch('https://upload.twitter.com/1.1/media/upload.json', parameters);
        var response = JSON.parse(result.getContentText());
        media.push(response.media_id_string);
      } else {
        var authorizationUrl = service.authorize();
        //msgPopUp("<iframe src='" + authorizationUrl + "&output=embed' width='600' height='500'></iframe>");
        msgPopUp('<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' + authorizationUrl + '">' + authorizationUrl + '</a></p>');
      }

    }
  } else {
    return []; // this is probably unnecessary
  }

  Logger.log(media);
  return media.join(',');
}

/*
 * Do the actual sending of a single tweet.
 *
*/

function doTweet(tweet, tweetID) {
  var properties = PropertiesService.getScriptProperties().getProperties();


  // if Image URL attaching is on, and one or more are found, pass the tweet to a function that will do the upload and 
  // return an array of media_ids

  if (properties.img == 'yes' &&
    tweet.match(/\.jpg|\.gif|\.png/i)
  ) {
    var media = getMediaIds(tweet);
    tweet = tweet.replace(/https?:[^ ]*?(\.png|\.jpg|\.gif)/gi, '');

  }

  var service = getTwitterService();

  if (service.hasAccess()) {

    if (typeof media != 'undefined' && media.length > 0) {
      var payload = { status: tweet, media_ids: media };

    } else {
      var payload = { status: tweet };
    }
  } else {
    var authorizationUrl = service.authorize();
    msgPopUp('<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' + authorizationUrl + '">' + authorizationUrl + '</a></p>');
  }

  var parameters = {
    method: 'post',
    payload: payload
  };


  try {
    var result = service.fetch('https://api.twitter.com/1.1/statuses/update.json', parameters);
    Logger.log(result.getContentText());
    var response = JSON.parse(result.getContentText());

    if (response.created_at && properties.constructor === 'every') {
      everyRotate();
    }

    if (response.created_at && properties.constructor === 'scheduled') {
      logScheduledTweet(response.created_at, tweetID);
    }

    doLog(response, tweet, 'Success');

  }
  catch (e) {
    Logger.log(e.toString());
    doLog(e, 'n/a', 'Error');
    if (properties.constructor === 'every') {
      if (properties.everyFail === 'skip') {
        everyRotate();
      }
    }
  }

}

function msgPopUp(msg) {
  var content = '<div style="font-family: Verdana;font-size: 22px; text-align:left; width: 80%; margin: 0 auto;">' + msg + '</div>';
  var htmlOutput = HtmlService
    .createHtmlOutput(content)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setWidth(600)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, ' ');

}

function onEdit(e) {
  updateSettings();
}

/*

 There are some words that your bot should not say. This function checks to make sure that it's not saying those words. 
 Based on Darius Kazemi's wordfilter: https://www.npmjs.com/package/wordfilter
 
*/

function wordFilter(text) {

  var properties = PropertiesService.getScriptProperties().getProperties();

  if (properties.ban.length > 1) {
    var more = properties.ban.split(",");
  }



  var badList = [
    "beeyotch", "biatch", "bitch", "chinaman", "chinamen", "chink", "cuck", "crip", "cunt", "dago", "daygo", "dego", "dick", "douchebag", "dyke", "fag", "fatass", "fatso", "gash", "gimp", "golliwog", "gook", "gyp", "halfbreed", "half-breed", "homo", "hooker", "jap", "kike", "kraut", "lame", "lardass", "lesbo", "negro", "nigga", "nigger", "paki", "pickaninny", "pussy", "raghead", "retard", "shemale", "skank", "slut", "spade", "spic", "spook", "tard", "tits", "titt", "trannies", "tranny", "twat", "wetback", "whore", "wop"
  ];

  var banned = new Array();

  if (properties.ban.length > 1) {
    var banned = badList.concat(properties.ban.split(","));
  } else {
    var banned = badList;
  }

  //Logger.log(banned);

  for (var w = 0; w <= banned.length; w++) {

    var filter = new RegExp(banned[w]);

    if (filter.test(text)) {
      return true;
    }
  }
  return false;
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