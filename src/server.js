'use strict';
var fs = require('fs');
var https = require('https');
var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

var clientList = require('./clientlist.js');

/* Implements basic message passing (server-side) */


//var HashMap = require('hashmap');

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
    
    // send random bytes for client to sign
    var client = clientList.newClient(socket);
    console.log("sending random bytes to " + socket.ipPort);
    socket.send(JSON.stringify({
        msgType : "signData",
        bytesToSign : nacl.util.encodeBase64(client.randomBytes),
        stringID : client.stringID,
    }));
});

function onMessage(socket, incomingData) {
    console.log(incomingData);
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "client " + socket.ipPort + " sent message without msgType!";
    
    var client = clientList.getBySocket(socket);
    switch(data.msgType) {
        case "signReturn":
            if (!client.verify(data.publicKey, data.bytesSigned)){
                throw "client failed verification, terminating session";
            }
            console.log("client " + socket.ipPort + " passed verification, id : " + client.stringID + " : public key : " + client.publicKey);
            break;
        case "sendMsg":
            var sendClient = clientList.getByID(data.stringID);
            if (sendClient) {
              sendClient.socket.send(JSON.stringify({
                msgType: "msgRecv",
                string: data.string,
                fromID: client.stringID,
              }));
              console.log(client);
            }
            break;
    }
}



