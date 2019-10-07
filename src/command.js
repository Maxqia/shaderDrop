'use strict';
const readline = require('readline');
const qrCode = require('qrcode-terminal');

var webrtc = require("./webrtc.js");

import WebSocketTransport from "./wstransport.js";
import WebRTCTransport from "./rtctransport.js";




var args = process.argv.slice(2);
var progName;
{
  let fileList = process.argv[1].split('/');
  progName = fileList[fileList.length - 1];
}

function printHelp() {
  console.error("Usage : "+progName+" (send|recv) [args] [file]"); 
  console.error("sends files/pipes through the shaderDrop network");
  console.error();
  console.error("Options:");
  console.error("  --id          id of the recieving party");
  console.error("  -h --help     Show this screen.");
  console.error("  --version     Show version number.");
  process.exit(1);
}

console.error('shaderDrop cli client');

if (args.length < 1) {
  console.error("not enough args");
  printHelp();
}


var ws = new WebSocketTransport();
var wrtc = new WebRTCTransport();
ws.log = (msg) => console.error(msg);
wrtc.log = (msg) => console.error(msg);

var newClientResolve;
var newClientPromise = new Promise((resolve, reject) => {
  newClientResolve = resolve;
});
ws.msgRecv = newClientMsgRecv;


var connectedID = null;
var command = args.shift();
if (args.length >= 2 && args[0] === "--id") {
  args.shift();
  connectedID = args.shift(); // TODO validate id somehow
}

// TODO input & output streams

switch( command ) {
  case 'send':
    send().catch((err) => console.error(err));
    break;
  case 'recv':
  case 'recieve':
    recieve().catch((err) => console.error(err));
    break;
  default:
    printHelp();
    break;
};


async function wsQrCode() {
  await ws.connect();
  qrCode.generate(ws.id, {small: true});
  console.error(ws.id);
}

function setupWRTC(clientID) {
  wrtc.sigSend = (str) => ws.sendMsg(clientID, str);
  ws.msgRecv = (clientID,str) => {
    if (id === clientID) {
      wrtc.sigRecv(str);
    }
  };
  
}

async function send() {
  await wsQrCode();
  if(!connectedID) {
    const [id, data] = await newClientPromise;
    connectedId = id;
  }
  setupWRTC(connectedID);
  await wrtc.start();
  
  
}


async function recieve() {
  await wsQrCode();
  
  const [id, incomingData] = await newClientPromise;
  connectedId = id;
  
  setupWRTC(connectedID);
  wrtc.sigRecv(incomingData);
  await wrtc.onOpenPromise;
  
}




function newClientMsgRecv(id, incomingData) {
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "recieved message without msgType!";
    
    switch(data.msgType) {
      case "connect":
        newClientResolve([data.clientID, incomingData]);
      case "offer":
        newClientResolve([id, incomingData]);
        break;
    };
}

