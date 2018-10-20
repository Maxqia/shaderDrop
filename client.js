'use strict';
const WebSocket = require('isomorphic-ws');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // temp for now
var keyPair = nacl.sign.keyPair();

var conn;
function connect() { // <- 1 tab

conn = new WebSocket("wss://shaderdrop.com/websocket/");

var currentLobby;
var currentLobbyMembers;

conn.onopen = function (event) {
    exports.log("server connected!")
    conn.send(JSON.stringify({
        msgType: "clientInit",
        //type: "client",
        publicKey: nacl.util.encodeBase64(keyPair.publicKey),
    }))
    exports.log("sent!")
}

conn.onmessage = function (event) {
    exports.log(event.data);
    var data = JSON.parse(event.data);
    switch (data.msgType) {
        case "signData":
            exports.log(data.bytesToSign);
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
            exports.newLobby(currentLobby);
            break;
        case "memberInLobbyChange": // TODO make this work properly
            //exports.log(data);
            if (data.lobby != currentLobby) {
                exports.log("Server sent wrong lobby?");
                conn.terminate();
                return;
            }
            if(data.isHereNow) {
                currentLobbyMembers.push(data.member);
            }
            break;
        case "dataString":
            exports.recvString(data);
            //exports.log(data.string);
            break;
    }
}

} // <- 1 tab

function sendString(str) {
    conn.send(JSON.stringify({
        msgType: "dataString",
        string: str,
    }));
}

function log(str) {
    console.log(str);
}

function pull(publicKey) {
    conn.send(JSON.stringify({
        msgType: "pullIntoCurrentLobby",
        publicKey: publicKey,
    }));
}

function newLobby(currentLobby) {
    exports.log("now in lobby : " + currentLobby);
}
connect();
exports.sendString = sendString;
exports.publicKey = nacl.util.encodeBase64(keyPair.publicKey);
exports.log = log;
exports.pull = pull;
exports.newLobby = newLobby;
