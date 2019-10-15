'use strict';
//const whyIsNodeRunning = require('why-is-node-running')
//global.whyIsNodeRunning = whyIsNodeRunning;
import qrCode from 'qrcode-terminal';
import nodePV from 'node-pv';
import fs from 'fs';

import WebSocketTransport from "./transport/wstransport.js";
import WebRTCTransport from "./transport/rtctransport.js";
import { RTCWriteStream, RTCReadStream } from "./transport/nodestr.js";




var args = process.argv.slice(2);
var progName;
{
  let fileList = process.argv[1].split('/');
  progName = fileList[fileList.length - 1];
}

function printHelpAndExit() {
  console.error("Usage : "+progName+" (send|recv) [args] [file]...");
  console.error("sends files/pipes through the shaderDrop network");
  console.error();
  console.error("Options:");
  console.error("  --id          id of the recieving party");
  console.error("  -h --help     Show this screen.");
  console.error("  -f --force    Overwrite file if it already exists");
  //console.error("  -v --version  Show version number.");
  process.exit(1);
}

console.error('shaderDrop cli client');

if (args.length < 1) {
  console.error("not enough args");
  printHelpAndExit();
}

// command line arguments
var command = args.shift();
var connectedID = null;
var files;
var force = false;
var debug = false;

for(let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "-h":
    case "--help":
      printHelpAndExit();
      break; // should not reach
    case "--id":
      if (args.length <= i+1) printHelpAndExit();
      connectedID = args[i+1]
      args.splice(i, 2);
      i = -1; // restart search
      break;
    case "-f":
    case "--force":
      force = true;
      args.splice(i, 1);
      i = -1; // restart search
      break;
    default:
      break;
  }
}
files = args;


var fileInfo;
var sending;
var ws = new WebSocketTransport();
var wrtc = new WebRTCTransport();
//ws.log = (msg) => console.error(msg);
//wrtc.log = (msg) => console.error(msg);
ws.log = (msg) => {};
wrtc.log = (msg) => {};
ws.msgRecv = newClientMsgRecv;

// TODO multiple files

var finalPromise;
switch (command) {
  case 'send':
    finalPromise = send();
    break;
  case 'recv':
  case 'recieve':
    finalPromise = recieve();
    break;
  default:
    console.error("unknown command");
    printHelpAndExit();
    break;
};

finalPromise.then(() => {
  console.error();
  console.error("done!");
  //whyIsNodeRunning(); // log unclosed handles
  //process.exit(1);
}).catch((error) => {
  //console.error(error.message);
  console.error(error);
  //whyIsNodeRunning(); // log unclosed handles
  printHelpAndExit();
});

function setupWRTC(clientID) {
  wrtc.setTransport(ws.transport(clientID));
}

async function getConnected() {
  await ws.connect();
  
  if(connectedID) { // we've been given an id to connect to!
    setupWRTC(connectedID);
    wrtc.sendOffer().catch((error) => console.error());
  }
  
  if(!connectedID) { // wait for someone to connect to us
    var id = await ws.id.get();
    qrCode.generate(id, {small: true}, function (qrcode) {
      console.error(qrcode);
    });
    console.error("id : " + id);
    
    ws.sendJSON({
      msgType: "update",
      clientInfo: {
        stringID: id,
        publicKey: ws.publicKey,
        sending: sending,
        file: fileInfo,
      },
    });
  }
  
  process.stderr.write("waiting for connection...");
  await wrtc.open.promise();
  process.stderr.write(" connected!\n");
}

async function disconnect() {
  await wrtc.close.promise();
  ws.disconnect();
  await ws.close.promise();
}

async function send() {
  // setup files
  var readStream;
  if (files.length >= 1) {
    if (files.length >= 2) throw new Error("sending more than one file not implemented");
    var file = files[0];
    var fileStat = fs.statSync(file);
    if (fileStat.isDirectory()) throw new Error("sending directories not implemented");
    
    var fileSplit = file.split('/');
    var fileName = fileSplit[fileSplit.length-1];
    
    readStream = fs.createReadStream(file);
    fileInfo = {
      name: fileName,
      size: fileStat.size,
    };
  } else {
    readStream = process.stdin;
    fileInfo = {
      name: "stdin",
      size: -1,
    };
  }
  sending = true;
  
  // send stream
  await getConnected();
  var writeStream = new RTCWriteStream(wrtc);
  

  
  fileInfo.msgType = "fileInfo";
  wrtc.sendJSON(fileInfo);
  
  var pv = nodePV({
    size: fileInfo.size,
    name: fileInfo.name,
  });
  pv.on('info', function(str) {
    process.stderr.write(str);
  });
  
  readStream.pipe(pv).pipe(writeStream);
  
  await disconnect();
}


async function recieve() {
  // setup files
  var writeStream;
  if (files.length >= 1) {
    if (files.length >= 2) throw new Error("recieving more than one file not implemented");
    var file = files[0];
    
    var fd;
    try {
      fd = fs.openSync(file, "wx"); //wx makes it throw error if the file already exists
    } catch (error) {
      if (force) {
        fd = fs.openSync(file, "w");
      } else {
        throw error;
      }
      // if we got here, it means we opened the file to be overwritten
      console.error("force specified, overwriting file : " + file); 
    }
    writeStream = fs.createWriteStream(null, { fd: fd });
  } else {
    writeStream = process.stdout;
  }
  sending = false;
  
  // recieve stream
  await getConnected();
  var readStream = new RTCReadStream(wrtc);
  
  var fileInfo = await wrtc.next('fileInfo', 1000, "did not recieve fileInfo message!");
  var pv = nodePV({
    size: fileInfo.size,
    name: fileInfo.name,
  });
  pv.on('info', function(str) {
    process.stderr.write(str);
  });
  
  readStream.pipe(pv).pipe(writeStream);
  
  await disconnect();
}


function newClientMsgRecv(id, incomingData) {
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "recieved message without msgType!";
    
    if (connectedID) {
      console.error("recieved unwanted message :" + id + ":" + incomingData);
      return;
    }

    
    switch(data.msgType) {
      case "connect":
        connectedID = data.clientID;
        //console.error("recieved request to connect to client: " + connectedID);
        setupWRTC(connectedID);
        wrtc.sendOffer().catch((error) => console.error());
        break;
      case "offer":
        connectedID = id;
        //console.error("recieved offer from client: " + connectedID);
        setupWRTC(connectedID);
        wrtc.transport.srvMsg(incomingData); // inject message back into wrtc
        break;
      default:
        //console.error("recieved unknown message :" + id + ":" + incomingData);
    };
}
