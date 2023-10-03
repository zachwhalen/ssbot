/* 

   A Spreadsheet-powered Twitter Bot Engine, version 0.6.5, May 2020
   
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
   
   This script makes use of Google's OAuth2 library and implements some concepts 
   inspired by or borrowed from Darius Kazemi and Martin Hawksey.

   Please add OAuth2 library via script id of 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF 

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

  if (ss[0].toString() === 'scheduled' && ss[1].toString() == "auto") { //Both Constructor & Timing must match.
    scriptProperties.setProperty('isAutoTiming', true);
  } else {
    scriptProperties.setProperty('isAutoTiming', false);
  }

  scriptProperties.
    setProperty('constructor', ss[0].toString()).
    setProperty('timing', convertTimingtoMinutes(ss[1].toString())).
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

  var lastRun = scriptProperties.getProperty('lastRunTime');
  if (!lastRun) {
    var now = new Date();
    scriptProperties.setProperty('lastRunTime', now.toJSON());
  }

  var timingReset = scriptProperties.getProperty('timingReset');
  if (!timingReset) {
    var now = new Date();
    scriptProperties.setProperty('timingReset', now.toJSON());
  }

  if (ScriptApp.getProjectTriggers().length > 0) {
    scriptProperties.setProperty('isScheduledPosting', true);
  } else {
    scriptProperties.setProperty('isScheduledPosting', false);
  }

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

function logScheduledTweet(rowID, success, response) {
  var display = "";
  var scheduledSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('scheduled');
  if (success == "true") {
    var d = new Date();
    var display = Utilities.formatDate(d, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "yyyy-MM-dd hh:mm a");
    scheduledSheet.getRange("b" + rowID + ":b" + rowID).setValue(response.data.id);
  } else {
    display = success;
  }
  scheduledSheet.getRange("c" + rowID + ":c" + rowID).setValue(display);
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

function convertTimingtoMinutes(originalTiming) {
  var timing = 0;
  switch (originalTiming) {
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
    case "1 minute":
      timing = 1;
      break;
    default:
      timing = 60;
  }
  return timing;
}

function setTiming(nextPostTime) {

  var properties = PropertiesService.getScriptProperties().getProperties();
  var scriptProperties = PropertiesService.getScriptProperties();
  var timing = properties.timing;

  if (properties.isAutoTiming == "true") {            //We are supposed to self adjust the timing schedule.
    if (nextPostTime) {                               //We know when the next run needs to be.
      var minutesTillNextPostTime = (nextPostTime - (new Date())) / 60000;
      if (minutesTillNextPostTime > (12*60)) {
        timing = 12*60;
      } else if (minutesTillNextPostTime > (8*60)) {
        timing = 8*60;
      } else if (minutesTillNextPostTime > (6*60)) {
        timing = 6*60;
      } else if (minutesTillNextPostTime > (4*60)) {
        timing = 4*60;
      } else if (minutesTillNextPostTime > (2*60)) {
        timing = 2*60;
      } else if (minutesTillNextPostTime > (1*60)) {
        timing = 1*60;
      } else if (minutesTillNextPostTime > 30) {
        timing = 30;
      } else if (minutesTillNextPostTime > 15) {
        timing = 15;
      } else if (minutesTillNextPostTime > 10) {
        timing = 10;
      } else if (minutesTillNextPostTime > 5) {
        timing = 5;
      } else {
        timing = 1;
      }
      if (timing > 1) {
        //More than 1 minute until next tweet so it is safe to move the lastRunTime forward.
          var now = new Date();
          scriptProperties.setProperty('lastRunTime', now.toJSON());
      }
    } else {
      timing = 1; //Since we have no idea when the next scheduled post should be assume it needs to be immediately.
    }
  }

  if (properties.isScheduledPosting != "true"           //If not currently auto posting
      || properties.timing != timing) {                 //Or if desired timing is different from current timing

    var trigger;
    if (timing >= 60) {
      var temp_timing = timing / 60;
      trigger = ScriptApp.newTrigger("generateSingleTweet")
          .timeBased()
          .everyHours(temp_timing)
          .create();
      Logger.log("Scheduled Posting set to every " + temp_timing + (temp_timing > 1?" Hours.":" Hour."));
      doLog("","Scheduled Posting set to every " + temp_timing + (temp_timing > 1?" Hours.":" Hour."),"Set Timing");
    } else if (timing > 0) {
      trigger = ScriptApp.newTrigger("generateSingleTweet")
          .timeBased()
          .everyMinutes(timing)
          .create();
      Logger.log("Scheduled Posting set to every " + timing + (timing > 1?" Minutes.":" Minute."));
      doLog("","Scheduled Posting set to every " + timing + (timing > 1?" Minutes.":" Minute."),"Set Timing");
    } else {
      trigger = ScriptApp.newTrigger("generateSingleTweet")
          .timeBased()
          .everyHours(1)
          .create();
      Logger.log("I couldn't find an interval to set so I assumed 1 hour.");
      doLog("","Scheduled Posting set to every 1 Hour. (Default)","Set Timing");
    }
    if (properties.isScheduledPosting != "true") {
      scriptProperties.setProperty('isScheduledPosting', true);
    }
    if (properties.timing != timing) {
      scriptProperties.setProperty('timing', timing);
    }
    // clear existing triggers other than this one.
    clearTiming(trigger);

    Logger.log(trigger);
  }
} 

function clearTiming(trigger) {
  //Note: If adding some additional whitelisted trigger here that never gets deleted, make sure to also update resetTiming() to account for it.
  var scriptProperties = PropertiesService.getScriptProperties();
  // clear any existing triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (typeof trigger === 'undefined'
        || trigger.getUniqueId() !== triggers[i].getUniqueId()) {
          ScriptApp.deleteTrigger(triggers[i]);
        }
  }
  if (typeof trigger === 'undefined') {
    Logger.log("Scheduled Posting turned off.");
    doLog("","Scheduled Posting turned off.","Set Timing");
    scriptProperties.setProperty('isScheduledPosting', false);
  }
}

function resetTiming() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var p = scriptProperties.getProperties();
  if (ScriptApp.getProjectTriggers().length < 1   //No active timing triggers (Note: adding triggers to this project will break this assumption.)
      || p.timing != 1) {                         //Or current timing is not already the minimum.

    var sanityFactor = 9;                         //Do nothing if last run or reset is less than this many minutes ago.

    var now = new Date();
    var lastRunFudged = new Date(p.lastRunTime);
    lastRunFudged.setMinutes(lastRunFudged.getMinutes() + sanityFactor);

    var lastResetFudged = new Date(p.timingReset);
    lastResetFudged.setMinutes(lastResetFudged.getMinutes() + sanityFactor);

    if (now > lastRunFudged && now > lastResetFudged) {
      Logger.log("Clearing existing triggers.");
      clearTiming();

      Logger.log("Resetting Scheduled Posting to every 1 Minute.");
      scriptProperties.setProperty('timingReset', now.toJSON());
      setTiming();
    } else {
      Logger.log("Not Resetting Scheduled Posting Due to Recent Activity.");
    }
  } else {
    Logger.log("Not Resetting Scheduled Posting Due to no need.");
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
  var userProps = PropertiesService.getUserProperties();

  pkceChallengeVerifier();

  return OAuth2.createService('Twitter')
  // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://twitter.com/i/oauth2/authorize')
      .setTokenUrl(
          'https://api.twitter.com/2/oauth2/token?code_verifier=' + userProps.getProperty('code_verifier'))

  // Set the client ID and secret.
      .setClientId(consumer_key)
      .setClientSecret(consumer_secret)

  // Set the name of the callback function that should be invoked to
  // complete the OAuth flow.
      .setCallbackFunction('authCallback')

  // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(userProps)

  // Set the scopes to request (space-separated for Twitter services).
      .setScope('tweet.read tweet.write users.read')

  // Add parameters in the authorization url
      .setParam('response_type', 'code')
      .setParam('code_challenge_method', 'S256')
      .setParam('code_challenge', userProps.getProperty('code_challenge'))

      .setTokenHeaders({
        'Authorization': 'Basic ' + Utilities.base64Encode(consumer_key + ':' + consumer_secret),
        'Content-Type': 'application/x-www-form-urlencoded'
      });
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}

/**
 * Generates code_verifier & code_challenge for PKCE
 */
function pkceChallengeVerifier() {
  var userProps = PropertiesService.getUserProperties();
  if (!userProps.getProperty('code_verifier')) {
    var verifier = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

    for (var i = 0; i < 128; i++) {
      verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    var sha256Hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier);

    var challenge = Utilities.base64Encode(sha256Hash)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    userProps.setProperty('code_verifier', verifier);
    userProps.setProperty('code_challenge', challenge);
  }
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
  var service = getTwitterService();
  service.reset();
  msgPopUp('<p>Your Twitter authorization credentials have been deleted. You\'ll need to re-run "Send a Test Tweet" to reauthorize before you can start posting again.');
}

/*
 * This is the function that finds a single tweet and passes it on to be sent out.
*/

function generateSingleTweet() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var properties = scriptProperties.getProperties();
  var now = new Date();
  
  var temp;
  var tempID;
  var retweetIDs;
  var replyIDs;
  if (properties.constructor == "scheduled") {
    var tempArray = getTweets(1, false); //1 tweet per block of time
    if (typeof tempArray == 'undefined' || tempArray.length < 1) {
      doLog("","Scheduled Tweet: There is nothing to Tweet now","Nothing");
      Logger.log("Scheduled Tweet: Nothing to tweet in this time block");
      //Nothing happened so it is safe to move the lastRunTime forward.
      scriptProperties.setProperty('lastRunTime', now.toJSON());
      return;
    }
    temp = tempArray.map(function(value,index) { return value[0]; });
    tempID = tempArray.map(function(value,index) { return value[1]; });
    retweetIDs = tempArray.map(function(value,index) { return value[2]; });
    replyIDs = tempArray.map(function(value,index) { return value[3]; });
    if (tempID[0] === 'Schedule') {
      doLog("","Scheduled Tweet: There is nothing to Tweet now","Nothing");
      Logger.log("Scheduled Tweet: Nothing to tweet in this time block");
      //Nothing happened so it is safe to move the lastRunTime forward.
      scriptProperties.setProperty('lastRunTime', now.toJSON());
    }
  } else {
    temp = getTweets(1, false);
  }
  var tweet;
  for (i = 0; i < temp.length; i++) {
    tweet = temp[i];

    if (typeof tweet != 'undefined' &&
      (tweet.length > properties.min || retweetIDs[i] !== '') &&
      !wordFilter(tweet) &&
      !curfew() &&
      (typeof tempID === 'undefined' || tempID[i] !== 'Schedule')) {
      if (properties.removeMentions == 'yes') {
        tweet = tweet.replace(/@[a-zA-Z0-9_]+/g, '');
      }
      if (properties.removeHashes == 'yes') {
        tweet = tweet.replace(/#[a-zA-Z0-9_]+/g, '');
      }
      while (tweet.match(/ {2}/g)) {
        tweet = tweet.replace(/ {2}/, ' ');
      }
      if (properties.constructor == "scheduled") {
        try {
          doTweet(tweet, tempID[i], retweetIDs[i], replyIDs[i]);
        } catch (err) {
          if (err == "Unauthorized") {
            doLog("Authorization attempted", "", 'Notice');
            Logger.log("Authorization attempted");
          } else {
            doLog("Error Actually Sending Tweet (Row #"+tempID[i]+")", tweet, 'Error');
            Logger.log("Error Actually Sending Tweet (Row #"+tempID[i]+")");
            if (properties.isAutoTiming == "true"                              //Auto updating timing is turned on
                && properties.isScheduledPosting == "true") {                  //Currently in unattended posting mode.
              //Something went wrong so be sure to try again as soon as possible.
              setTiming();
            }
          }
          return; //Exit. Do not contiue to try other tweets (or to record sucessful tweet)
        }
      }else{
        try {
          doTweet(tweet);
        } catch (err) {
          if (err == "Unauthorized") {
            doLog("Authorization attempted", "", 'Notice');
            Logger.log("Authorization attempted");
          } else {
            doLog("Error Actually Sending Tweet", tweet, 'Error');
            Logger.log("Error Actually Sending Tweet ("+tweet+")");
          }
          return; //Exit. Do not contiue to try other tweets (or to record sucessful tweet)
        }
      } 
    } else if (tempID[i] === 'Schedule') {
      setTiming(tweet);
    } else {
      Logger.log("Too short, or some other problem.");
      Logger.log(tweet);
      Logger.log("Wordfilter: " + wordFilter(tweet));
      if (curfew()) {
        doLog("Tweet blocked by curfew", tweet, 'Error');
      } else if (wordFilter(tweet)) {
        doLog("Tweet uses banned words", tweet, 'Error');
      } else {
        doLog("Tweet to Short or nonexistent", tweet, 'Error');
      }
    }
  }
  //Not doing this allows for multiple tweets to be set for the same time and get "queued" up and tweeted one minute apart.
  //Doing this will ignore the "queue" and only send the "oldest"
  //scriptProperties.setProperty('lastRunTime', now.toJSON());
}

function curfew() {
  var properties = PropertiesService.getScriptProperties().getProperties();

  // check the time

  var time = new Date();
  var hour = time.getHours();

  var quietBegin = parseFloat(properties.quietStart);
  var quietEnd = parseFloat(properties.quietEnd);

  if (quietBegin == quietEnd) {
    return false;
  }

  if (quietEnd > quietBegin) {
    if (hour >= quietBegin && hour < quietEnd) {
      Logger.log("Quiet hours");
      return true;
    }
  } else {
    if (hour >= quietBegin || hour < quietEnd) {
      Logger.log("Quiet hours");
      return true;
    }
  }

  return false;
}

/*
 * Do the actual sending of a single tweet.
 *
*/

function doTweet(tweet, tweetID, retweetID, replyID) {
  var properties = PropertiesService.getScriptProperties().getProperties();

  var service = getTwitterService();

  if (service.hasAccess()) {

    if (typeof retweetID === 'undefined' || retweetID.length < 10) {
      if (typeof replyID === 'undefined' || replyID.length < 10) {
        var payload = JSON.stringify({ text: tweet });
      } else {
        var payload = JSON.stringify({ text: tweet, reply:{in_reply_to_tweet_id: replyID}});
      }
    } else {
      var payload = JSON.stringify({ text: tweet, quote_tweet_id: retweetID });
    }
  
    var parameters = {
      method: 'post',
      headers: { 
        "Authorization": 'Bearer ' + service.getAccessToken(),
        "Content-Type": 'application/json'
      },
      payload: payload
    };

    try {
      var result = UrlFetchApp.fetch('https://api.twitter.com/2/tweets', parameters);
      Logger.log(result.getContentText());
      var response = JSON.parse(result.getContentText());

      if (response.data.id && properties.constructor === 'every') {
        everyRotate();
      }

      if (response.data.id && properties.constructor === 'scheduled') {
        logScheduledTweet(tweetID, "true", response);
      }

      doLog(response, tweet, 'Success');

    }
    catch (e) {
      Logger.log(e.toString());
      doLog(e, 'n/a', 'Error');
      if (properties.constructor === 'every' && properties.everyFail === 'skip') {
        everyRotate();
      }
      if (properties.constructor === 'scheduled') {
        if (properties.everyFail === 'skip') {
          logScheduledTweet(tweetID, "Error", response);
        } else {
          //Something went wrong so be sure to try again as soon as possible.
          setTiming();
        }
      }
      if (properties.constructor === 'scheduled' && e.toString().includes("Status is a duplicate")) {
        logScheduledTweet(tweetID, "Duplicate (Race Condition?)", response);
      }
    }
  } else {
    var authorizationUrl = service.getAuthorizationUrl();

    msgPopUp('<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' + authorizationUrl + '">' + authorizationUrl + '</a></p>');

    throw("Unauthorized");
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
  var activeSheet = e.source.getActiveSheet();
  var range = e.range;
  if (activeSheet.getName() !== "Settings" && activeSheet.getName() !== "Setup") return;
  updateSettings();
}

/*

 There are some words that your bot should not say. This function checks to make sure that it's not saying those words. 
 Based on Darius Kazemi's wordfilter: https://www.npmjs.com/package/wordfilter
 
*/

function wordFilter(text) {

  var properties = PropertiesService.getScriptProperties().getProperties();

  var badList = [
    "beeyotch", "biatch", "bitch", "chinaman", "chinamen", "chink", "cuck", "crip", "cunt", "dago", "daygo", "dego", "dick", "douchebag", "dyke", "fag", "fatass", "fatso", "gash", "gimp", "golliwog", "gook", "gyp", "halfbreed", "half-breed", "homo", "hooker", "jap", "kike", "kraut", "lame", "lardass", "lesbo", "negro", "nigga", "nigger", "paki", "pickaninny", "pussy", "raghead", "retard", "shemale", "skank", "slut", "spade", "spic", "spook", "tard", "tits", "titt", "trannies", "tranny", "twat", "wetback", "whore", "wop"
  ];

  var banned = new Array();

  if (properties.ban.length > 1) {
    //If properties.ban is OFF then return empty array. Thus turning off this word filter.
    if (properties.ban !== "OFF") {
      var banned = badList.concat(properties.ban.split(","));      
    }
  } else {
    var banned = badList;
  }

  //Logger.log(banned);

  for (var w = 0; w < banned.length; w++) {

    var filter = new RegExp(banned[w]);

    if (filter.test(text)) {
      return true;
    }
  }
  return false;
}

function doLog(msg, tweet, status) {


  var d = new Date();

  var currentTime = d.toLocaleString();

  var ls = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("log");
  // var logVals = new Array();
  var logVals = [[currentTime, status, tweet, msg]];

  ls.insertRowBefore(2);
  ls.getRange("A2:D2").setValues(logVals);

}