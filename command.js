'use strict';
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const client = require("./client.js");

const readline = require('readline');


var pubKeyString = nacl.util.encodeBase64(client.publicKey);

//pubKeyString = pubKeyString.substring(0,32);
const qrCode = require('qrcode-terminal');
qrCode.generate(pubKeyString, {small: true});
//qrCode.generate(pubKeyString);
//console.log(pubKeyString);

/*const QRCode = require('qrcode');
QRCode.toDataURL(pubKeyString, function (err, url) {
  console.log(url)
})*/


client.recvString = function(data) {
    // if we didn't send it, display it
    if (data.from != pubKeyString) {
        console.log(data.string);
    }
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/*rl.on('line', (input) => {
    if (input.startsWith("/")) {
        var pubKeyPull = input.substr(1);
        conn.send(JSON.stringify({
            msgType: "pullIntoCurrentLobby",
            publicKey: pubKeyPull,
        }))
    }
    
    conn.send(JSON.stringify({ 
        msgType : "dataString",
        string: input,
    }));
});*/

rl.on('line', (input) => {
    if (input.startsWith("/")) {
        var pubKeyPull = input.substr(1);
        client.pull(pubKeyPull);
    }
    
    client.sendString(input);
});