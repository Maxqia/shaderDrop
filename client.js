var WebSocket = require('ws');
var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
var qrCode = require('qrcode-terminal');

var conn = new WebSocket("ws://127.0.0.1:8081");

var keyPair = nacl.sign.keyPair();
var pubKeyString = nacl.util.encodeBase64(keyPair.publicKey);
console.log(pubKeyString);
qrCode.generate(pubKeyString);

conn.onopen = function (event) {
    console.log("server connected!")
}

conn.onmessage = function (event) {
    var data = JSON.parse(event.data);
    if (data.signBytes) {
        console.log(data.signBytes);
        var signBytesArray = nacl.util.decodeBase64(data.signBytes);
        var signiture = nacl.sign(nacl.util.decodeBase64(data.signBytes), keyPair.secretKey);
        conn.send(JSON.stringify({ type : "publicKeySend",
                    publicKey : nacl.util.encodeBase64(keyPair.publicKey),
                    signiture : nacl.util.encodeBase64(signiture),
                                 }));
    }
}