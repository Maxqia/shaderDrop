var WebSocket = require('ws');
var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
var qrCode = require('qrcode-terminal');
var readline = require('readline');

var conn = new WebSocket("ws://127.0.0.1:8081");

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var keyPair = nacl.sign.keyPair();
var pubKeyString = nacl.util.encodeBase64(keyPair.publicKey);
qrCode.generate(pubKeyString);
console.log(pubKeyString);

var currentLobby;
var currentLobbyMembers;

conn.onopen = function (event) {
    console.log("server connected!")
    conn.send(JSON.stringify({
        msgType: "clientInit",
        //type: "client",
        publicKey: nacl.util.encodeBase64(keyPair.publicKey),
    }))
    console.log("sent!")
}

conn.onmessage = function (event) {
    console.log(event.data);
    var data = JSON.parse(event.data);
    switch (data.msgType) {
        case "signData":
            console.log(data.bytesToSign);
            var bytesToSign = nacl.util.decodeBase64(data.bytesToSign);
            var signiture = nacl.sign(bytesToSign, keyPair.secretKey);
            conn.send(JSON.stringify({ 
                        msgType : "signReturn",
                        bytesSigned : nacl.util.encodeBase64(signiture),
            }));
            break;
        case "newLobby":
            currentLobby = data.lobby;
            currentLobbyMembers = data.lobbyMembers;
            console.log("now in lobby : " + currentLobby);
            break;
        case "memberInLobbyChange": // TODO make this work properly
            console.log(data);
            if (data.lobby != currentLobby) {
                console.log("Server sent wrong lobby?");
                conn.terminate();
                return;
            }
            if(data.isHereNow) {
                currentLobbyMembers.push(data.member);
            }
            break;
        case "dataString":
            console.log(data.string);
            break;
    }
}

rl.on('line', (input) => {
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
});