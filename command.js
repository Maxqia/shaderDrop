'use strict';
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const client = require("./client.js");

const qrCode = require('qrcode-terminal');
const readline = require('readline');


var pubKeyString = nacl.util.encodeBase64(client.publicKey);
//qrCode.generate(pubKeyString, {small: true});
qrCode.generate(pubKeyString);
//console.log(pubKeyString);

client.recvString = function(str) {
    console.log(str);
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