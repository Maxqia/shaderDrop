'use strict';
var $ = require("jquery");
const QRCode = require('qrcode');

var client = require("./client.js");
var webrtc = require("./webrtc.js");

var qrCanvas = document.getElementById('qrcode');



client.gotID = function() {
  QRCode.toCanvas(qrCanvas, client.id, function (error) {
    if (error) console.error(error);
    console.log('success!');
  });
  setTimeout(test, 1000);
}

var connectedTo = null;

/*var chat = document.getElementById("chat");
client.msgRecv = function(id, incomingData) {
    // if we didn't send it, display it
    //if (data.from != pubKeyString) {
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(id+" : "+incomingData));
        chat.appendChild(li);
    //}
    
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "recieved message without msgType!";
    switch(data.msgType) {
      case "connect":
        connect(data.clientID);
        break;
    };
}

 $('#lobby').text("lobby : ");
function connect(id) {
  connectedTo = id;
  $('#lobby').text("lobby : " + id);
}

$('#messageBox').keypress(function(e) {
    if (e.which == 13) {
        client.sendMsg(connectedTo, JSON.stringify({ msgType : "message", message : $('#messageBox').val()}));
        $('#messageBox').val('');
        return false;
    }
});*/


function test() {
  // fake connect message
  if(client.id === "2") {
    webrtc.msgRecv("3", JSON.stringify({
      msgType: "connect",
      clientID: "1",
    }));
  }
}
