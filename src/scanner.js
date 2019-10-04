const client = require("./client.js");
const Instascan = require("@eventstag/instascan");

var scanner = new Instascan.Scanner({ 
    video: document.getElementById('preview'),
    mirror: false,
});



scanner.addListener('scan', function (content) {
    console.log(content);
    onScan(content);

});

var clientList = [];
function onScan(ID) {
    client.sendMsg(ID, JSON.stringify({
        msgType : "scanned",
    }));
    
    clientList.push(ID);
    if (clientList.length == 2) {
      client.sendMsg(clientList[1], JSON.stringify({
        msgType : "connect",
        clientID : clientList[0],
      }));
     client.sendMsg(clientList[0], JSON.stringify({
        msgType : "connect",
        clientID : clientList[1],
      }));
    }
}

Instascan.Camera.getCameras().then(function (cameras) {
    if (cameras.length > 0) {
      scanner.start(cameras[1]);
    } else {
      console.error('No cameras found.');
    }
}).catch(function (e) {
    console.error(e);
});
