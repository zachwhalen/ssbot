/* A Spreadsheet-powered Twitterbot Engine, version 0.4, May 2015
   
   by Zach Whalen (@zachwhalen, zachwhalen.net, etc.)
   
   This code powers the backend for a front-end in a google spreadsheet. If somehow you've arrived at this code without the spreadsheet, start by making a copy of that sheet by visiting this link:
   
   bit.ly/botsheet
   
   All of the setup instructions are available in the sheet or (with pictures!) in this blog post:
   
   http://zachwhalen.net/posts/how-to-make-a-twitter-bot-with-google-spreadsheets-version-04
   
   The code here is offered as-is with no guarantee that it works or that by using it you won't make Twitter mad at you. 
   Use it at your own discretion bearing in mind Twitter's terms of service and Darius Kazemi's "Basic Twitter bot Etiquette": http://tinysubversions.com/2013/03/basic-twitter-bot-etiquette/
   
   This work is offered under a CC-BY license, so you may do whatever you like to modify, improve, distribute, or even profit from it. Just let me know.

   This script makes use of [that Twitter library] and implements some concepts inspired by or borrowed from Darius Kazemi and Martin Hawksey.
   
   TODO: The Twitter auth popup.
   TODO: the options to strip tags and @'s

*/



/*   THE NEXT FEW FUNCTIONS ARE FOR MAKING OUTPUT   */


/* 
  Use settings in the "_ebooks" sheet to generate *_ebooks-like output. 
  Implements a basic Markov chaining algorithm for nonsense
*/

function getEbooksText (count) {
  
  if (typeof count !== 'undefined'){
   var quota = count; 
  }else{
   var quota = 1; 
  }
  

  var tagsUrl = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_ebooks").getRange('b15').getValues();
  
  var tagss = SpreadsheetApp.openByUrl(tagsUrl);
  
  var settings = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("_ebooks").getRange('c20:c21').getValues();
  Logger.log(settings);
  var ss = tagss.getSheetByName("Archive");
  
  var lastRow = ss.getLastRow();
  
  var tweets = [];
  var beginnings = [];
  var endings = [];
  var data = new Object();
  
  // gather some tweets
  
  var allTweets = tagss.getSheetByName("Archive").getRange("c2:c"+lastRow).getValues();
  
  for (var z = 0; z < allTweets.length; z++){
   // Logger.log(allTweets[z]);
    
    var tweet = allTweets[z][0];
    
    // remove some things (later make optional)
    var twt = tweet.replace(/https?:\/\/t\.co\/[a-z0-9]+/ig, '').replace(/RT :/, '');
    
    // check whether to remove hashtags 
    var stripTags = settings[0][0];
    var stripAts = settings[1][0];
   
     Logger.log(stripTags + " and " + stripAts);
    
    if (stripTags === "yes"){
     twt = twt.replace(/#[a-zA-Z0-9_]+/g, '').replace(/RT :/, '');
    }
    
     if (stripAts === "yes"){
     Logger.log("Removing @'s");
     twt = twt.replace(/@[a-zA-Z0-9_]+/g, '').replace(/RT :/, '');
    }
    
    var asList = twt.split(" "); 
    
    // build a list of beginnings and endings
    beginnings.push(asList[0]);
    endings.push(asList[ asList.length - 1 ]);

         
    // push the words into the data structure
     for (var t = 0; t < asList.length - 1; t++){
      if (typeof data[asList[t]] == 'object'){
        if (asList[t + 1].length > 0 & typeof asList[t + 1] !== 'undefined'){
          data[asList[t]].push(asList[t + 1]); 
        }
      }else{
        data[asList[t]] = new Array();
        if (asList[t + 1].length > 0 & typeof asList[t + 1] !== 'undefined'){
          data[asList[t]].push(asList[t + 1]); 
        }
     }
    }
  }
  
  
  // build it
  for (var q = 0; q < quota; q++){
  // start with a beginning
  var msg = '';
  while (msg.length == 0){
   msg =  beginnings[Math.floor(Math.random() * beginnings.length - 1)];  
  }

 var dead = false;
  while (msg.length < 120 & dead === false){
    var sofar = msg.split(" ");
    var trunk = sofar[sofar.length - 1];
    if (typeof data[trunk] !== 'undefined'){
      var branch = data[trunk][ Math.floor((Math.random() * data[trunk].length)) ];
      if (typeof branch !== 'undefined' & endings.indexOf(branch) < 0){
        msg = msg + " " + branch; 
      }else{
       dead = true; 
      }
    }else{
      dead = true; 
    }    
  }
  
  Logger.log(msg);
  
  
  return msg;
  
}
}

/*
 
 GENERATE TWEETS BY SELECTING ONE CELL FROM EACH COLUMN
 
*/

function getColumnSelectText(count) {
  
   
  if (typeof count !== 'undefined'){
   var quota = count; 
  }else{
   var quota = 1; 
  }
  
  var rows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Select from Columns").getDataRange();
  var values = rows.getValues();
  var numRows = rows.getNumRows();
  var numCols = rows.getNumColumns();
  
  var list = new Array();
  
  for (var r = 4; r < numRows; r++){
    
    var thisRow = values[r];
    
    for (var c = 1; c < numCols; c++){
      
      if (typeof thisRow[c] !== 'undefined'){
        if (typeof list[c] == 'undefined'){
          list[c] = new Array();
        }
        list[c].push(thisRow[c]);
      }
      
    }
   }
  
  
  for (var q = 0; q < quota; q++){
    var tweet = '';
    for (var k = 1; k < list.length; k++){
      if (tweet.length < 140){
        
        // actual length
        
        var len = 0;
        
        for (var l = 0; l < list[k].length; l++){
          if (typeof list[k][l] !== 'undefined'){
            if (list[k][l].length > 0){
              len = l;
            }
          }
        }
        
        var word = list[k][Math.floor(Math.random()*(len + 1))];
        
        // make sure word is not undefined
        if (typeof (word) != 'undefined'){
          
          if (typeof (word) != 'string'){
            word = JSON.stringify(word); 
          }
          
          var tweaked = word.replace(/\\n/g, "\n");
          tweet = tweet + " " + tweaked;
        }
      }
    }
    
    
    
    return tweet;
  }
  
}

/*
 
 MAKE TWEETS BY SELECTING ONE CELL FROM EACH ROW
 
*/


function getRowSelectText(count){
  
   
  if (typeof count !== 'undefined'){
   var quota = count; 
  }else{
   var quota = 1; 
  }
  // select one cell from each row
  
  var rows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Select from Rows").getDataRange();
  var values = rows. getValues();
  var numRows = rows.getNumRows();
  var list = new Array();
    
  for (var i = 4; i <= numRows - 1; i++){
    var row = values[i];
    list[i] = new Array();
    
    // find the actual limit of this row
    var len = 0;
    for (var j = 1; j <= row.length; j++){
      if (row[j]){
        list[i][j] = row[j]; 
      }
    }
  }
  
 
  for (var q = 0; q < quota; q++){
       var tweet = '';
       for (var k = 4; k < list.length; k++){
    if (tweet.length < 140){
      // Logger.log(list[k]);
      var word = list[k][Math.floor(Math.random()*(list[k].length - 1)) + 1];
      
      // make sure word is not undefined
      if (typeof (word) != 'undefined'){
        
        if (typeof (word) != 'string'){
          word = JSON.stringify(word); 
        }
        
        var tweaked = word.replace(/\\n/g, "\n");
        tweet = tweet + " " + tweaked;
      }
      
    }
  }
  
  Logger.log(tweet);
  
  return tweet;
}
}

/* 
 
 USE THE TEXT IN THE "MARKOV" SHEET TO MAKE NONSENSE

*/

function getMarkovText(count) {
  
   
  if (typeof count !== 'undefined'){
   var quota = count; 
  }else{
   var quota = 1; 
  }
  
  // grab the appropriate spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Markov');
  
  // get all the text, from b5 and following
  var range = sheet.getRange('b5:b'+sheet.getLastRow());
  var txt = range.getValues().join(" ").replace("  ", " ").split(" ");

  // make words into data
  var data = new Object();  
  var firsts = new Array();
  var lasts = new Array();
  for (var i = 0; i < txt.length - 1; i++){
    
    if (/[A-Z]/.test(txt[i][0])){
      firsts.push(txt[i]);
    }
    
    if(/[\.|\?]"?$/.test(txt[i])){
      if(firsts.indexOf(txt[i]) < 0){
        lasts.push(txt[i]); 
      }
    }
    
    if (typeof data[txt[i]] == 'object'){
      if (txt[i + 1].length > 0){
        data[txt[i]].push(txt[i + 1]); 
      }
    }else{
      data[txt[i]] = new Array();
      if (txt[i + 1].length > 0){
        data[txt[i]].push(txt[i + 1]); 
      }
    }   
  }
  
//  Logger.log(lasts);
  
 // return;

  // build it
  
  //var seed = Math.floor((Math.random() * Object.keys(data).length) + 1);
  
  for (var q = 0; q < quota; q++){
  
    var seed = Math.floor(Math.random() * firsts.length);
    
    var msg = firsts[seed];
    var dead = false;
    while (msg.length < 120 & dead === false){
      var sofar = msg.split(" ");
      var trunk = sofar[sofar.length - 1];
      
      
      if (typeof data[trunk] !== 'undefined' & lasts.indexOf(trunk) < 0){
        var branch = data[trunk][ Math.floor((Math.random() * data[trunk].length)) ];
        if (typeof branch !== 'undefined'){ msg = msg + " " + branch; }else{ dead = true; } 
      }else{
        dead = true; 
      }    
    }
    
    //Logger.log(firsts);
    //Logger.log(msg);
    return msg;
  }
}



/*
 *    SETUP  
 *
*/


function preview () {
  
  // set up and clear preview sheet
  var previewSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Preview Output");
  previewSheet.getRange('b4:b20').setValue(" ");
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(previewSheet);
  
  // figure out what type of tweets to make
  var sheetNameToGet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Setup").getRange('b43').getValue();
  
  switch(sheetNameToGet){
    case "Markov":
      var textFunction = getMarkovText;
      break;
    case "Select from Rows":
      var textFunction = getRowSelectText;
      break;
    case "Select from Columns":
      var textFunction = getColumnSelectText;
      break;
    case "_ebooks":
      var textFunction = getEbooksText;
      break;
    default:
      Logger.log("I don't know what happened, but I can't figure out what sort of text to generate.");     
  }
    
  
  for (var p = 0; p < 16; p++){
    var offset = p + 5;
    var prv = textFunction(10); // change this value if you want more or less preview output
    previewSheet.getRange('b'+offset).setValue(prv);  
  }
  
  
}

function setTiming () {
  
  // clear any existing triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  // get the value set in the timing menu
  
  var setting = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Setup").getRange('b54').getValue();
  
  switch (setting){
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

function clearTiming () {
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
  ui.createMenu('Bot')
  
      .addItem('Generate Preview', 'preview')
      .addSeparator()
      .addItem('Send a Test Tweet', 'generateSingleTweet')
      .addItem('Revoke Twitter Authorization', 'authorizationRevoke')
      .addSeparator()
      .addItem('Start Posting Tweets', 'setTiming')
      .addItem('Stop Posting Tweets', 'clearTiming')
      .addToUi();
  
  

};

function getTwitterService() {
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Setup');
  var twitter_name = sheet.getRange('b9').getValue();
  var consumer_key = sheet.getRange('b23').getValue();
  var consumer_secret = sheet.getRange('b26').getValue();
  var project_key = sheet.getRange('b32').getValue();
 
  var service = OAuth1.createService('twitter');
   
  service.setAccessTokenUrl('https://api.twitter.com/oauth/access_token');
  
  service.setRequestTokenUrl('https://api.twitter.com/oauth/request_token');
 

  service.setAuthorizationUrl('https://api.twitter.com/oauth/authorize');
  service.setConsumerKey(consumer_key);
  service.setConsumerSecret(consumer_secret);
  service.setProjectKey(project_key);
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

function fixedEncodeURIComponent (str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

function authorizationRevoke(){
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty('oauth1.twitter');
  msgPopUp('<p>Your Twitter authorization credentials have been deleted. You\'ll need to re-run "Send a Test Tweet" to reauthorize before you can start posting again.');
}

/*
 * This is the function that finds a single tweet and passes it on to be sent out.
 * I suppose this could be combined with the preview-generation function but hey I have other stuff to do.
*/

function generateSingleTweet() {
  
  // figure out what to get
  var sheetNameToGet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Setup").getRange('b43').getValue();
  
  switch(sheetNameToGet){
    case "Markov":
      var textFunction = getMarkovText;
      break;
    case "Select from Rows":
      var textFunction = getRowSelectText;
      break;
    case "Select from Columns":
      var textFunction = getColumnSelectText;
      break;
    case "_ebooks":
      var textFunction = getEbooksText;
      break;
    default:
      Logger.log("I don't know what happened or why, but I can't figure out what sort of text to generate.");     
  }
  
  var tweet = textFunction();
  
  doTweet(tweet);
  
}

/*
 * Do the actual sending of a single tweet.
 *
*/

function doTweet (tweet) {
  
  var service = getTwitterService();
  
  if (service.hasAccess()) {
    var status = 'https://api.twitter.com/1.1/statuses/update.json';
    var payload = "status=" + fixedEncodeURIComponent(tweet);
    
  } else {
    var authorizationUrl = service.authorize();
    //msgPopUp("<iframe src='" + authorizationUrl + "&output=embed' width='600' height='500'></iframe>");
    msgPopUp('<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' + authorizationUrl + '">' + authorizationUrl + '</a></p>');
  }

  var parameters = {
    "method": "POST",
    "escaping": false,
    "payload" : payload
  };

  try {
    var result = service.fetch('https://api.twitter.com/1.1/statuses/update.json', parameters);
    Logger.log(result.getContentText());    
  }  
  catch (e) {    
    Logger.log(e.toString());
  }

}

function msgPopUp (msg) {
  var content = '<div style="font-family: Verdana;font-size: 22px; text-align:left; width: 95%; margin: 0 auto;">' + msg + '</div>';
   var htmlOutput = HtmlService
   .createHtmlOutput(content)
     .setSandboxMode(HtmlService.SandboxMode.IFRAME)
     .setWidth(600)
     .setHeight(500);
 SpreadsheetApp.getUi().showModalDialog(htmlOutput, ' ');
  
}




/*
 * Vestigial.
 *
*/
function listTweets() {
  var service = getTwitterService();
  if (service.hasAccess()) {
    var url = 'https://api.twitter.com/1.1/statuses/user_timeline.json';
    var response = service.fetch(url);
    var tweets = JSON.parse(response.getContentText());
    for (var i = 0; i < tweets.length; i++) {
      Logger.log(tweets[i].text);
    }
  } else {
    var authorizationUrl = service.authorize();
    
    Logger.log('Please visit the following URL and then re-run the script: ' + authorizationUrl);

  }
}
