var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

var HashMap = require('hashmap');


var wsServer = new WebSocketServer( {
    port : 8081,
    clientTracking: true,
} );

var lobbies = new Object();


function createRandomLobby() {
    
}

function onScannerMessage(socket, data) {
    
}

function onClientMessage(socket, data) {
    switch(data.msgType) {
        case "clientType" :
            socket.publicKey = nacl.util.decodeBase64(data.publicKey);
            socket.verified = false;
            
            socket.signBytes = nacl.randomBytes(nacl.sign.signatureLength);
            console.log("sending random bytes to " + socket.ipPort);
            socket.send(JSON.stringify({
                msgType : "signData",
                bytesToSign : nacl.util.encodeBase64(socket.signBytes),
            }));
            break;
        case "signReturn":
            var verifyBytes = nacl.sign.open(nacl.util.decodeBase64(data.bytesSigned), socket.publicKey);
            if (!nacl.verify(socket.signBytes, verifyBytes)) {
                throw "client failed verification, terminating session";
            }
            console.log("client " + socket.ipPort + " passed verification, public key : " + socket.publicKey);
            socket.verified = true;
            break;
        case "dataString":
            console.log(data.string);
            //if (socket.verified) socket.lobby.sendToAll(data);
    }
}

function onMessage(socket, incomingData) {
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "client " + socket.ipPort + " sent message without msgType!";
    
    switch(data.msgType) {
        case "clientType":
            socket.clientType = data.type;
            break;
    }
    
    if (!socket.hasOwnProperty("clientType")) return;
    
    if (socket.clientType == "client") {
        onClientMessage(socket, data)
    }

    if (socket.clientType == "scanner") {
        onScannerMessage(socket, data);
    }

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
});




