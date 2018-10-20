var fs = require('fs');
var https = require('https');
var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

//var HashMap = require('hashmap');

/*const server = new https.createServer({
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem')
}).listen(8081);*/

var wsServer = new WebSocketServer( {
//  server,
    host : "127.0.0.3",
    port : 8081,
    clientTracking: true,
} );

var lobbies = new Object();

function lobbyAsPubKeyList(lobby) {
    var retVal = new Array();
    lobby.forEach(function (client) {
       retVal.push(client.publicKey);
    });
    return retVal;
}

function createLobby(socket) {
    lobbies[socket.publicKey] = new Array();
    lobbies[socket.publicKey].id = socket.publicKey;
    lobbies[socket.publicKey].push(socket);
    
    socket.lobby = socket.publicKey;
    socket.send(JSON.stringify({
        msgType: "newLobby",
        lobby: socket.publicKey,
        lobbyMembers: lobbyAsPubKeyList(lobbies[socket.publicKey]),
    }));
}

function leaveLobby(socket) {
    var index = lobbies[socket.lobby].indexOf(socket);
    lobbies[socket.lobby].splice(index,1);
    
    if (lobbies[socket.lobby].length == 0) {
        delete lobbies[socket.lobby];
        return;
    }
    
    // send all current clients a change notification
    lobbies[socket.lobby].forEach(function(client) {
       client.send(JSON.stringify({
           msgType: "memberInLobbyChange",
           lobby: socket.lobby,
           member: socket.publicKey,
           isHereNow: false,
       }));
    });
}

// if you need to optimize joining, this is the place to start
function pullIntoLobby(socket, pullPublicKey) {
    var pullSocket;
    wsServer.clients.forEach(function(client) {
       if (client.publicKey == pullPublicKey) {
           pullSocket = client;
       }
    });
    if (!pullSocket) {
        console.log("couldn't find pullPublicKey's corresponding socket");
        return;
    }
    
    // send all current clients a change notification
    lobbies[socket.publicKey].forEach(function(client) {
       client.send(JSON.stringify({
           msgType: "memberInLobbyChange",
           lobby: socket.publicKey,
           member: pullSocket.publicKey,
           isHereNow: true,
       }));
    });
    
    // add new client to lobby
    leaveLobby(pullSocket);
    lobbies[socket.publicKey].push(pullSocket);
    pullSocket.lobby = socket.publicKey;
    pullSocket.send(JSON.stringify({
        msgType: "newLobby",
        lobby: socket.publicKey,
        lobbyMembers: lobbyAsPubKeyList(lobbies[socket.publicKey]),
    }));
    
}

function onMessage(socket, incomingData) {
    console.log(incomingData);
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
        case "pullIntoCurrentLobby":
            pullIntoLobby(socket, data.publicKey);
            break;
        case "dataString":
            console.log(data.string);
            lobbies[socket.lobby].forEach(function(client) {
                //console.log(client);
                client.send(JSON.stringify({
                    msgType: "dataString",
                    string: data.string,
                    from: socket.publicKey,
                }));
            });
            break;
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
        leaveLobby(socket);
    })
});




