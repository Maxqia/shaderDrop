'use strict';
import WebSocket from 'isomorphic-ws';
import nacl from 'tweetnacl';
import naclutil from 'tweetnacl-util';

import {FutureValue, FutureEvent} from '@shaderdrop/event';
import {Transport, MessageType} from './transport';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"; // HACK : ignore self signed certificate

class WebSocketIDTransport extends Transport {
  id: string;
  transport: WebSocketTransport;
  constructor(transport: WebSocketTransport, id: string) {
    super();
    this.transport = transport;
    this.id = id;
  }
  
  send(msg: MessageType) {
    this.transport.sendToID(this.id, msg);
  }
};

/* connects to our websocket infrasturcture for message passing */
export default class WebSocketTransport extends Transport {
  open: FutureEvent<WebSocket.OpenEvent> = new FutureEvent();
  close: FutureEvent<WebSocket.CloseEvent> = new FutureEvent();
  error: FutureEvent<WebSocket.ErrorEvent> = new FutureEvent();
  
  keyPair: nacl.SignKeyPair;
  publicKey: string;
  id: FutureValue<String> = new FutureValue();
  
  msgRecv: (id: string, str: string) => void;
  clientHandler: Map<string, {(msg: MessageType): void}> = new Map();
  conn: WebSocket = null;
  
  constructor() {
    super();
    this.keyPair = nacl.sign.keyPair();
    this.publicKey = naclutil.encodeBase64(this.keyPair.publicKey);
  
    this.msgRecv = (id, str) => this.log("recieved string from : " + id + " : " + str);
    this.sendToID = this.sendToID.bind(this);
    
    this.on("signData", this.signData.bind(this));
    this.on("msgRecv", this.srvMsgRecieved.bind(this));
    
    this.error.register((error: WebSocket.ErrorEvent) => {
      this.log(error);
    });
  }
  
  connect(url?: string): Promise<WebSocket.OpenEvent> {
    if (typeof url === 'undefined') {
      url = typeof location !== 'undefined' ? "wss://"+location.host+"/websocket/" : "wss://127.0.0.1:8082/websocket/";
    }
    this.conn = new WebSocket(url);
    
    this.conn.onmessage = (event: WebSocket.MessageEvent) => {
      // @ts-ignore TODO support buffer arrays  
      this.srvMsg(event.data);
    };
    this.conn.onopen = this.open.fire;
    this.conn.onclose = this.close.fire;
    this.conn.onerror = this.error.fire;
    return new Promise((resolve, reject) => {
      this.error.register(reject);
      this.open.register(resolve);
      setTimeout(() => {
        this.open.unregister(resolve);
        this.error.unregister(reject);
        reject("connection timed out!");
      }, 1000);
    });
  }
  
  disconnect(): Promise<WebSocket.CloseEvent> {
    this.conn.close();
    return this.close.promise();
  }
  
  send(data: MessageType): void {
    this.conn.send(data);
  }
  
  sendToID(id: string, str: MessageType): void {
    this.sendJSON({
        msgType: "sendMsg",
        stringID: id,
        string: str,
    });
  }
  
  // passes messages to the message handler
  srvMsgRecieved(data: any): void {
      var handler = this.clientHandler.get(data.fromID);
      if (handler !== undefined) {
        handler(data.string);
        return;
      }
      this.msgRecv(data.fromID, data.string);
  }
  
  transport(id: string): Transport {
    var ret = new WebSocketIDTransport(this, id);
    this.clientHandler.set(id, ret.srvMsg);
    return ret;
  }
  
  // performs the handshake
  signData(data: any): void {
      this.log(data.bytesToSign);
      var bytesToSign = naclutil.decodeBase64(data.bytesToSign);
      var signiture = nacl.sign(bytesToSign, this.keyPair.secretKey);
      this.conn.send(JSON.stringify({ 
          msgType : "signReturn",
          publicKey: naclutil.encodeBase64(this.keyPair.publicKey),
          bytesSigned : naclutil.encodeBase64(signiture),
      }));
      
      this.log("id : " + data.stringID);
      this.id.setValue(data.stringID);
  }
  

}
