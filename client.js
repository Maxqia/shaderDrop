'use strict';
const WebSocket = require('isomorphic-ws');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

/* Implements basic message passing (client-side) */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // temp for now
var keyPair = nacl.sign.keyPair();

var conn;
function connect() { // <- 1 tab

//conn = new WebSocket("wss://shaderdrop.com/websocket/");
conn = new WebSocket("ws://127.0.0.3:8081/websocket/");

conn.onopen = function (event) {
    exports.log("server connected!");
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
                        publicKey: nacl.util.encodeBase64(keyPair.publicKey),
                        bytesSigned : nacl.util.encodeBase64(signiture),
            }));
            exports.id = data.stringID;
            break;
        case "msgRecv":
            exports.log("recieved string from : " + id + " : " + str);
            exports.msgRecv(data.id, data.string);
            break;
    }
}

} // <- 1 tab

function sendMsg(id, str) {
    conn.send(JSON.stringify({
        msgType: "sendMsg",
        id : id,
        string: str,
    }));
}

function log(str) {
    console.log(str);
}

connect();
exports.msgRecv = null;
exports.sendString = sendString;
exports.publicKey = nacl.util.encodeBase64(keyPair.publicKey);
exports.id = null;
exports.log = log;

