'use strict';
const readline = require('readline');
const qrCode = require('qrcode-terminal');

var client = require("./client.js");
var webrtc = require("./webrtc.js");

client.gotID = () => {
  qrCode.generate(client.id, {small: true});
  setTimeout(test, 1000);
};

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/*client.recvString = function(data) {
    // if we didn't send it, display it
    if (data.from != pubKeyString) {
        console.log(data.string);
    }
}

rl.on('line', (input) => {
    if (input.startsWith("/")) {
        var pubKeyPull = input.substr(1);
        client.pull(pubKeyPull);
    }
    
    client.sendString(input);
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

