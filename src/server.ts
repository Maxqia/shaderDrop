'use strict';
import fs from "fs";

import http from "http";
import https from "https";
import WebSocket from "ws";
import express from "express";

import nacl from "tweetnacl";
import naclutil from "tweetnacl-util";
import uuidv1 from "uuid/v1";

import {Client} from "./TestObject";
import {MessageHandler} from "./transport/transport";

/* Implements basic message passing (server-side) */
var clientList = new Map();

//var number = 0;
function getRandomID() {
    //number++;
    //return number.toString();
    return uuidv1();
}

// TODO server-side validation of clientInfo & function variables
class ShaderDropClient extends MessageHandler {
    randomBytes: Uint8Array;
    verified: boolean = false;
    publicKeyEnc: string = null;
    stringID: string;
    clientInfo: Client = null;
    subscribed: ShaderDropClient[] = []; // clients subscribed for this client's clientInfo updates
    subscribers: ShaderDropClient[] = []; // clients this client subscribed to
    socket: any;
    
    constructor(socket) {
        super();
        this.socket = socket;
        this.randomBytes = nacl.randomBytes(nacl.sign.signatureLength);
        this.stringID = getRandomID();
        
        this.defaultHandler = (data: any) => {
          throw "unknown msgType! : " + data.msgType;
        };
        this.binaryHandler = (msg: any) => {
          throw "binary message not allowed!";
        };
        
        this.on("signReturn", this.signReturn.bind(this));
        this.on("sendMsg", this.sendMsg.bind(this));
        this.on("subscribe", this.subscribe.bind(this));
        this.on("unsubscribe", this.unsubscribe.bind(this));
        this.on("update", this.update.bind(this));
        clientList.set(this.stringID, this);
    }
    
    // returns true if verification passed
    verify(publicKeyEnc: string, signedBytesEnc: string): boolean {
        this.publicKeyEnc = publicKeyEnc;
        let signedBytes: Uint8Array = naclutil.decodeBase64(signedBytesEnc);
        let publicKey: Uint8Array = naclutil.decodeBase64(publicKeyEnc);
        let verifyBytes: Uint8Array = nacl.sign.open(signedBytes, publicKey);
        this.verified = nacl.verify(this.randomBytes, verifyBytes);
        //delete this.randomBytes;
        return this.verified;
    }
    
    cleanup() {
        for (let subscriber of this.subscribed) {
          if (typeof subscriber === "undefined") continue;
          this.socket.send(JSON.stringify({
            msgType: "clientInfo",
            stringID: this.stringID,
            string: { msgType : "close" },
          }));
          subscriber.subscribers.filter((element) => element !== this);
        };
        
        for (let subscribed of this.subscribers) {
          if (typeof subscribed === "undefined") continue;
          subscribed.subscribed.filter((element) => element !== this);
        }
    }
    
    sendRandomBytes() {
        // send random bytes for client to sign
        console.log("sending random bytes to " + this.socket.ipPort);
        this.socket.send(JSON.stringify({
            msgType : "signData",
            bytesToSign : naclutil.encodeBase64(this.randomBytes),
            stringID : this.stringID,
        }));
    }
    
    signReturn(data: any) {
        if (!this.verify(data.publicKey, data.bytesSigned)){
            throw "client failed verification, terminating session";
        }
        console.log("client " + this.socket.ipPort + " passed verification, id : " + this.stringID + " : public key : " + this.publicKeyEnc);
    }
    
    sendMsg(data: any) {
        var sendClient = clientList.get(data.stringID);
        if (sendClient) {
          sendClient.socket.send(JSON.stringify({
            msgType: "msgRecv",
            string: data.string,
            fromID: this.stringID,
          }));
        }
    }
    
    subscribe(data: any) {
        var client = clientList.get(data.stringID);
        if (client) {
            this.subscribed.push(client);
            client.subscribers.push(this);


            this.socket.send(JSON.stringify({
              msgType: "clientInfo",
              stringID: client.stringID,
              clientInfo: client.clientInfo,
            }));
        } else {
            this.socket.send(JSON.stringify({
              msgType: "clientInfo",
              stringID: data.stringID,
              clientInfo : "invalid"
            }));
        }
    }
    
    unsubscribe(data: any) {
        var client = clientList.get(data.stringID);
        if (client) {
          this.subscribed.filter((element) => element !== client);
          client.subscribers.filter((element) => element !== this);
        }
    }
    
    // TODO better verification and updating
    update(data: any) {
        this.clientInfo = data.clientInfo;
        for (let subscriber of this.subscribed) {
          subscriber.socket.send(JSON.stringify({
            msgType: "clientInfo",
            stringID: this.stringID,
            string: { 
              msgType : "update",
              string: this.clientInfo,
            },
          }));
        }
    }
}

export function setupWsServer(wsServer) {
    wsServer.on("connection", function(socket, request) {
        socket.ipPort = request.socket.remoteAddress + ":" + request.socket.remotePort;
        console.log("client " + socket.ipPort + " connected");
        let client: ShaderDropClient = new ShaderDropClient(socket);
        
        socket.on("message", function(data) {
            try {
                client.srvMsg(data);
            } catch (error) {
                console.log("error on " + socket.ipPort + ":" + error);
                socket.terminate();
            }
        });
        
        socket.on("close", function(code, reason) {
            console.log("client " + socket.ipPort + " closed due to : " + reason);
            try {
              client.cleanup();
            } catch (error) {
              console.log("error closing " + socket.ipPort + error);
            }
        });
        client.sendRandomBytes();
    });
}


function startup() {
  let app = express();
  app.use(express.static("public"));
  app.use(express.static("dist"));
  
  let server;
  if (process.env.HTTPS) {
    server = https.createServer({
      key: fs.readFileSync(process.env.SSLPRIV),
      cert: fs.readFileSync(process.env.SSLPUB),
    }, app)
  } else {
    server = http.createServer({}, app);
  }
  
  server.listen(process.env.PORT);
  
  let wsServer = new WebSocket.Server({ noServer: true });
  setupWsServer(wsServer);
  server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
      wsServer.emit('connection', ws, request);
    });
  });
}

if (require.main === module) {
  startup();
}




