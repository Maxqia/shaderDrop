const client = require("./client.js");
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
var $ = require("jquery");

const QRCode = require('qrcode');
var qrCanvas = document.getElementById('qrcode');
QRCode.toCanvas(qrCanvas, client.publicKey, function (error) {
  if (error) console.error(error)
  console.log('success!');
})

var chat = document.getElementById("chat");
client.recvString = function(data) {
    // if we didn't send it, display it
    //if (data.from != pubKeyString) {
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(data.string));
        chat.appendChild(li);
    //}
}

 $('#lobby').text("lobby : ");
client.newLobby = function(lobby) {
    //console.log(lobby);
    $('#lobby').text("lobby : " + lobby);
}

$('#messageBox').keypress(function(e) {
    if (e.which == 13) {
        client.sendString($('#messageBox').val());
        $('#messageBox').val('');
        return false;
    }
});