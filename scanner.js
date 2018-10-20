const client = require("./client.js");
const Instascan = require("instascan");

var scanner = new Instascan.Scanner({ 
    video: document.getElementById('preview'),
    mirror: false,
});

scanner.addListener('scan', function (content) {
    console.log(content);
    client.pull(content);
});

Instascan.Camera.getCameras().then(function (cameras) {
    if (cameras.length > 0) {
      scanner.start(cameras[1]);
    } else {
      console.error('No cameras found.');
    }
}).catch(function (e) {
    console.error(e);
});