'use strict';

import {FutureEvent} from '../event';

// TODO more strict typing
export type MessageType = any;
export type MessageCallback = (msg: MessageType) => void;
export class MessageHandler {
  log: {(msg): void} = (msg) => console.log(msg);
  handlers: Map<string,MessageCallback> = new Map();
  defaultHandler: MessageCallback = (msg) => {
      this.log("Message not handled! : " + msg);
    };
  
  constructor() {
    this.srvMsg = this.srvMsg.bind(this);
    this.on = this.on.bind(this);
  }
  
  srvMsg(incomingData: MessageType) {
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
  
  on(msgType: string, callback: MessageCallback) {
    this.handlers.set(msgType, callback);
  }
  
  next(msgType: string, timeout?: number, timeoutMsg?: string): Promise<MessageType> {
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

export abstract class Transport extends MessageHandler {
  open: FutureEvent<any> = new FutureEvent();
  close: FutureEvent<any> = new FutureEvent();
  error: FutureEvent<any> = new FutureEvent();
  constructor() {
    super();
  }
  
  abstract send(data: any): void;
  sendJSON(object: any) {
    this.send(JSON.stringify(object));
  }
}
