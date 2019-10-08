'use strict';
const WebSocket = require('isomorphic-ws');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

/* connects to our websocket infrasturcture for message passing */
export default class WebSocketTransport {
  constructor() {
    this.keyPair = nacl.sign.keyPair();
    this.publicKey = nacl.util.encodeBase64(this.keyPair.publicKey);
  
    // public interface
    this.log = (msg) => console.log(msg);
    this.msgRecv = (id, str) => this.log("recieved string from : " + id + " : " + str);
    this.sendMsg = this.sendMsg.bind(this);
    this.id = null;
    this.onIDRecieved = () => {};
    // end public interface
  }
  
  connect() {
    var url = typeof location !== 'undefined' ? "wss://"+location.host+"/websocket/" : "wss://127.0.0.1:8082/websocket/";
    this.conn = new WebSocket(url);
    this.conn.onmessage = this.onMessage.bind(this);
    
    return new Promise((resolve, reject) => {
      this.conn.onopen = resolve;
      this.conn.onerror = reject;
    });
  }
  
  getID() {
    return new Promise((resolve, reject) => {
      if (this.id) resolve(this.id);
      this.onIDRecieved = () => resolve(this.id);
    });
  }
  
  sendMsg(id, str) {
    this.conn.send(JSON.stringify({
        msgType: "sendMsg",
        stringID: id,
        string: str,
    }));
  }
  
  // performs the handshake & passes the message to the message handler
  onMessage(event) {
    var data = JSON.parse(event.data);
    switch (data.msgType) {
      case "signData":
        this.log(data.bytesToSign);
        var bytesToSign = nacl.util.decodeBase64(data.bytesToSign);
        var signiture = nacl.sign(bytesToSign, this.keyPair.secretKey);
        this.conn.send(JSON.stringify({ 
                    msgType : "signReturn",
                    publicKey: nacl.util.encodeBase64(this.keyPair.publicKey),
                    bytesSigned : nacl.util.encodeBase64(signiture),
        }));
        
        this.log("id : " + data.stringID);
        this.id = data.stringID;
        this.onIDRecieved();
        break;
      case "msgRecv":
        this.msgRecv(data.fromID, data.string);
        break;
    }
  }
}
