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
console.log(pubKeyString);
qrCode.generate(pubKeyString);

var currentLobby;
var currentLobbyMembers;

conn.onopen = function (event) {
    console.log("server connected!")
    conn.send(JSON.stringify({
        msgType: "clientType",
        type: "client",
        publicKey: nacl.util.encodeBase64(keyPair.publicKey),
    }))
}

conn.onmessage = function (event) {
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
        case "reqNewLobby":
            currentLobby = data.newLobby;
            currentLobbyMembers = data.lobbyMembers;
            conn.send(JSON.stringify({
                msgType: "ackNewLobby",
                newLobby: currentLobby,
                switched: true,
            }));
            break;
        case "newMemberInLobby":
            if (lobby != currentLobby) {
                console.log("Server sent wrong lobby?");
                conn.terminate();
                return;
            }
            currentLobbyMembers.push(data.member);
            break;
        case "dataString":
            console.log(data.string);
            break;
    }
}

rl.on('line', (input) => {
    conn.send(JSON.stringify({ 
            msgType : "dataString",
            string: input,
    }));
});