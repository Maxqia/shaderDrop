const client = require("./client.js");
var $ = require("jquery");

const QRCode = require('qrcode');
var qrCanvas = document.getElementById('qrcode');
QRCode.toCanvas(qrCanvas, client.publicKey, function (error) {
  if (error) console.error(error)
  console.log('success!');
})

var connectedTo = null;

var chat = document.getElementById("chat");
client.msgRecv = function(id, data) {
    // if we didn't send it, display it
    //if (data.from != pubKeyString) {
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(id+" : "data));
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
        client.sendString($('#messageBox').val());
        $('#messageBox').val('');
        return false;
    }
});
