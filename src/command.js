'use strict';
const client = require("./client.js");
const readline = require('readline');
const qrCode = require('qrcode-terminal');

qrCode.generate(client.publicKey, {small: true});

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

rl.on('line', (input) => {
    if (input.startsWith("/")) {
        var pubKeyPull = input.substr(1);
        client.pull(pubKeyPull);
    }
    
    client.sendString(input);
});