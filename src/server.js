'use strict';
var fs = require('fs');
var https = require('https');
var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const uuidv1 = require('uuid/v1');

/* Implements basic message passing (server-side) */

/*const server = new https.createServer({
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem')
}).listen(8081);*/

var wsServer = new WebSocketServer( {
//  server,
    host : "0.0.0.0",
    port : 8081,
    clientTracking: true,
} );

var clientList = new Map();

//var number = 0;
function getRandomID() {
  //number++;
  //return number.toString();
  return uuidv1();
}

function socketSetup() {
    this.randomBytes = nacl.randomBytes(nacl.sign.signatureLength);
    this.verified = false;
    this.publicKey = null;
    this.stringID = getRandomID();
    clientList.set(this.stringID, this);
}

// returns true if verification passed
function socketVerify(publicKey, signedBytes) {
    this.publicKey = publicKey;
    var verifyBytes = nacl.sign.open(nacl.util.decodeBase64(signedBytes),  nacl.util.decodeBase64(publicKey));
    this.verified = nacl.verify(this.randomBytes, verifyBytes);
    delete this.randomBytes;
    return this.verified;
}

wsServer.on("connection", function(socket, request) {
    socket.ipPort = request.socket.remoteAddress + ":" + request.socket.remotePort;
    console.log("client " + socket.ipPort + " connected");
    
    socket.on("message", function(data) {
        try {
            onMessage(socket, data);
        } catch (error) {
            console.log(error);
            socket.terminate();
        }
    });
    
    socket.on("close", function(code, reason) {
        console.log("client " + socket.ipPort + " closed due to : " + reason);
    })
    

    socket.setup = socketSetup;
    socket.verify = socketVerify;
    socket.setup();
    // send random bytes for client to sign
    console.log("sending random bytes to " + socket.ipPort);
    socket.send(JSON.stringify({
        msgType : "signData",
        bytesToSign : nacl.util.encodeBase64(socket.randomBytes),
        stringID : socket.stringID,
    }));
});

function onMessage(socket, incomingData) {
    console.log(incomingData);
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "client " + socket.ipPort + " sent message without msgType!";
    
    switch(data.msgType) {
        case "signReturn":
            if (!socket.verify(data.publicKey, data.bytesSigned)){
                throw "client failed verification, terminating session";
            }
            console.log("client " + socket.ipPort + " passed verification, id : " + socket.stringID + " : public key : " + socket.publicKey);
            break;
        case "sendMsg":
            var sendClient = clientList.get(data.stringID);
            if (sendClient) {
              sendClient.send(JSON.stringify({
                msgType: "msgRecv",
                string: data.string,
                fromID: socket.stringID,
              }));
            }
            break;
    }
}



