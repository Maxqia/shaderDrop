'use strict';
const WebSocket = require('isomorphic-ws');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

/* Implements basic message passing (client-side) */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // temp for now
var keyPair = nacl.sign.keyPair();

var conn;
function connect() { // <- 1 tab


//"wss://shaderdrop.com/websocket/"
var url = typeof location !== 'undefined' ? "wss://"+location.host+"/websocket/" : "wss://127.0.0.1:8082/websocket/";
conn = new WebSocket(url);

conn.onopen = function (event) {
    exports.log("server connected!");
}

conn.onmessage = function (event) {
    //exports.log(event.data);
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
            
            exports.log("id : " + data.stringID);
            exports.id = data.stringID;
            if (exports.gotID) exports.gotID();
            break;
        case "msgRecv":
            //msgRecv(data.fromID, data.string);
            if (exports.msgRecv) exports.msgRecv(data.fromID, data.string);
            break;
    }
}

} // <- 1 tab

function sendMsg(id, str) {
    conn.send(JSON.stringify({
        msgType: "sendMsg",
        stringID: id,
        string: str,
    }));
}

function msgRecv(id, str) {
  exports.log("recieved string from : " + id + " : " + str);
}

function log(str) {
    console.log(str);
}

connect();
exports.msgRecv = null;
exports.sendMsg = sendMsg;
exports.publicKey = nacl.util.encodeBase64(keyPair.publicKey);
exports.id = null;
exports.log = log;
exports.gotID = null

