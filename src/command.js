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

function setupSigWRTC(clientID) {
  wrtc.sigSend = (str) => ws.sendMsg(clientID, str);
  ws.msgRecv = (clientID,str) => {
    if (id === clientID) {
      wrtc.sigRecv(str);
    }
  };
}


async function getConnected() {
  await ws.connect();

  if(connectedID) { // we've been given an id to connect to!
    setupSigWRTC(connectedID);
  }
  
  if(!connectedID) { // wait for someone to connect to us
    qrCode.generate(ws.id, {small: true});
    console.error(ws.id);
  }
  await wrtc.start();
}

async function send() {
  await getConnected();
  var writeStream = new RTCWriteStream(wrtc);
  
  if (file) {
    // TODO
  } else {
    process.stdin.pipe(writeStream);
  }
}


async function recieve() {
  await getConnected();
  var readStream = new RTCReadStream(wrtc);
  
  if (file) {
    // TODO
  } else {
    readStream.pipe(process.stdout);
    process.stdin.pipe(WriteStream);
  }
}


function newClientMsgRecv(id, incomingData) {
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "recieved message without msgType!";
    
    if (id === connectedID) {
      wrtc.sigRecv(incomingData);
      return;
    }
    if (connectedID) {
      console.error("recieved unwanted message :" + id + ":" + incomingData;
      return;
    }
    
    switch(data.msgType) {
      case "connect":
        connectedID = data.clientID;
        console.error("recieved request to connect to
        setupSigWRTC(connectedID);
        break;
      case "offer":
        connectedID = data.clientID;
        setupSigWRTC(connectedID);
        wrtc.sigRecv(incomingData);
        break;
    };
}

