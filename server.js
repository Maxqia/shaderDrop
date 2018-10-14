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

function createLobby(socket) {
    lobbies[socket.publicKey] = new Array();
    lobbies[socket.publicKey].id = socket.publicKey;
    lobbies[socket.publicKey].push(socket);
    
    socket.lobby = socket.publicKey;
    pullSocket.send(JSON.stringify({
        msgType: "newLobby",
        lobby: socket.publicKey,
        lobbyMembers: lobbies[socket.publicKey],
    }));
}

// if you need to optimize joining, this is the place to start
function pullIntoLobby(lobbySocket, pullPublicKey) {
    var pullSocket;
    wsServer.clients.forEach(function(client) {
       if (client.publicKey == pullPublicKey)  {
           pullSocket = client;
       }
    });
    if (!pullSocket) {
        console.log("couldn't find pullPublicKey's corresponding socket");
        return;
    }
    
    lobbies[socket.publicKey].push(pullSocket);
    lobbies[socket.publicKey].forEach(function(client) {
       client.send(JSON.stringify({
           msgType: "memberInLobbyChange",
           member: pullSocket.publicKey,
           isHereNow: true,
       }));
    });
    
    // TODO just run a cleanup function instead
    if(pullSocket.lobby == pullSocket.publicKey) {
        delete lobbies[publicKey];
    }
    
    pullSocket.lobby = lobbySocket.publicKey;
    pullSocket.send(JSON.stringify({
        msgType: "newLobby",
        lobby: lobbySocket.publicKey,
        lobbyMembers: lobbies[socket.publicKey],
    }));
    
}

function onMessage(socket, incomingData) {
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "client " + socket.ipPort + " sent message without msgType!";
    
    switch(data.msgType) {
        case "clientInit" :
            //socket.clientType = data.type;
            socket.publicKey = data.publicKey;
            socket.verified = false;
            
            socket.signBytes = nacl.randomBytes(nacl.sign.signatureLength);
            console.log("sending random bytes to " + socket.ipPort);
            socket.send(JSON.stringify({
                msgType : "signData",
                bytesToSign : nacl.util.encodeBase64(socket.signBytes),
            }));
            break;
        case "signReturn":
            var verifyBytes = nacl.sign.open(nacl.util.decodeBase64(data.bytesSigned),  nacl.util.decodeBase64(socket.publicKey));
            if (!nacl.verify(socket.signBytes, verifyBytes)) {
                throw "client failed verification, terminating session";
            }
            console.log("client " + socket.ipPort + " passed verification, public key : " + socket.publicKey);
            delete socket.signBytes;
            socket.verified = true;
            createLobby(socket);
            break;
        case "pull":
            pullIntoLobby(socket, data.publicKey);
            break;
        case "dataString":
            console.log(data.string);
            socket.lobby.forEach(function(client) {
               client.send(JSON.stringify(data));
            });
            break;
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




