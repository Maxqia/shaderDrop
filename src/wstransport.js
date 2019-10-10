'use strict';
import WebSocket from 'isomorphic-ws';
var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

import {FutureValue} from './event.js';
import {Transport, MessageHandler} from './transport.js';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // HACK : ignore self signed certificate

class WebSocketIDTransport extends Transport {
  constructor(transport, id) {
    super();
    this.transport = transport;
    this.id = id;
  }
  
  sendMsg(msg) {
    this.transport.sendMsg(this.id, msg);
  }
};

/* connects to our websocket infrasturcture for message passing */
export default class WebSocketTransport extends Transport {
  constructor() {
    super();
    this.keyPair = nacl.sign.keyPair();
    this.publicKey = nacl.util.encodeBase64(this.keyPair.publicKey);
  
    // public interface
    this.msgRecv = (id, str) => this.log("recieved string from : " + id + " : " + str);
    this.sendMsg = this.sendMsg.bind(this);
    this.id = new FutureValue();
    // end public interface
    
    this.clientHandler = new Map();
    this.on("signData", this.signData.bind(this));
    this.on("msgRecv", this.srvMsgRecieved.bind(this));
  }
  
  connect() {
    var url = typeof location !== 'undefined' ? "wss://"+location.host+"/websocket/" : "wss://127.0.0.1:8082/websocket/";
    this.conn = new WebSocket(url);
    
    this.conn.onmessage = (event) => this.srvMsg(event.data);
    this.conn.onopen = this.open.fire;
    this.conn.onclose = this.close.fire;
    return this.open.promise(1000, "connection timed out!");
  }
  
  sendMsg(id, str) {
    this.conn.send(JSON.stringify({
        msgType: "sendMsg",
        stringID: id,
        string: str,
    }));
  }
  
  // passes messages to the message handler
  srvMsgRecieved(data) {
      var handler = this.clientHandler.get(data.fromID);
      if (handler !== undefined) {
        handler(data.string);
        return;
      }
      this.msgRecv(data.fromID, data.string);
  }
  
  transport(id) {
    var ret = new WebSocketIDTransport(this, id);
    this.clientHandler.set(id, ret.srvMsg);
    return ret;
  }
  
  // performs the handshake
  signData(data) {
      this.log(data.bytesToSign);
      var bytesToSign = nacl.util.decodeBase64(data.bytesToSign);
      var signiture = nacl.sign(bytesToSign, this.keyPair.secretKey);
      this.conn.send(JSON.stringify({ 
          msgType : "signReturn",
          publicKey: nacl.util.encodeBase64(this.keyPair.publicKey),
          bytesSigned : nacl.util.encodeBase64(signiture),
      }));
      
      this.log("id : " + data.stringID);
      this.id.setValue(data.stringID);
  }
  

}
