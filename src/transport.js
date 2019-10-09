'use strict';

import {FutureEvent} from './event.js';

export class MessageHandler {
  constructor() {
    this.log = (msg) => console.log(msg);
    this.handlers = new Map();
    this.defaultHandler = (msg) => {
      this.log("Message not handled! : " + msg);
    };
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
}

export class Transport extends MessageHandler {
  constructor() {
    super();
    this.open = new FutureEvent();
    this.close = new FutureEvent();
    
    this.sendMsg = (object) => {
      throw "sendMsg not defined! : object : " + object; 
    };
  }
}
