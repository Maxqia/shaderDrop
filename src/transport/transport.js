'use strict';

import {FutureEvent} from '../event.ts';

export class MessageHandler {
  constructor() {
    this.log = (msg) => console.log(msg);
    this.handlers = new Map();
    this.defaultHandler = (msg) => {
      this.log("Message not handled! : " + msg);
    };
    
    this.srvMsg = this.srvMsg.bind(this);
    this.on = this.on.bind(this);
  }
  
  srvMsg(incomingData) {
    if (typeof incomingData === "string") {
      var data = JSON.parse(incomingData);
      if (!data.hasOwnProperty("msgType")) throw "recieved message without msgType!";
      
      var handler = this.handlers.get(data.msgType);
      if (handler !== undefined) {
        handler(data);
        return;
      }
      this.defaultHandler(data);
    }
    this.defaultHandler(incomingData);
  }
  
  on(msgType, callback) {
    this.handlers.set(msgType, callback);
  }
  
  next(msgType, timeout, timeoutMsg) {
    return new Promise((resolve, reject) => {
      if (timeout != undefined) {
        setTimeout(() => {
          this.handlers.delete(msgType);
          reject(timeoutMsg);
        }, timeout);
      }
      this.handlers.set(msgType, (data) => {
        this.handlers.delete(msgType);
        resolve(data);
      });
    })
  }
}

export class Transport extends MessageHandler {
  constructor() {
    super();
    this.open = new FutureEvent();
    this.close = new FutureEvent();
    this.error = new FutureEvent();
  }
  
  send(data) {
    throw new Error("send not defined! : object : " + data);
  }
  
  sendJSON(object) {
    this.send(JSON.stringify(object));
  }
}
