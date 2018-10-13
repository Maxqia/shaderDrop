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

wsServer.on("connection", function(socket, request) {
    var signBytes = nacl.randomBytes(nacl.sign.signatureLength);
    var publicKey;
    
    console.log("client connected, sending random bytes : " + signBytes);
    socket.send(JSON.stringify({
        msgType : "readData",
        bytesToSign : nacl.util.encodeBase64(signBytes),
    }));
    
    socket.on("message", function (data) {
        var data = JSON.parse(data);
        
        switch(data.msgType) {
            case "sendPublicKey":
                publicKey = nacl.util.decodeBase64(data.publicKey);
                var verifyBytes = nacl.sign.open(nacl.util.decodeBase64(data.bytesSigned), publicKey);
                if (!nacl.verify(signBytes, verifyBytes)) {
                    console.log("client failed verification, terminating session");
                    socket.terminate();
                    return;
                }
                console.log("client passed verification, public key : " + data.publicKey);
                break;
        }
    });
});


