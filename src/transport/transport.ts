'use strict';

export type BinMsgType = ArrayBuffer;
export type MessageType = string | BinMsgType;
export class MessageHandler {
  log: {(msg): void} = (msg) => console.log(msg);
  handlers: Map<string,{(msg: any): void}> = new Map();
  defaultHandler: {(msg: any): void} = (msg: any) => {
      this.log("Message not handled! : " + msg);
    };
  binaryHandler: {(data: BinMsgType) : void} = (data: BinMsgType) => {
      this.log("Binary Message not handled! : " + data);
    };
  
  constructor() {
    this.srvMsg = this.srvMsg.bind(this);
    this.on = this.on.bind(this);
  }
  
  srvMsg(incomingData: MessageType): void {
    if (typeof incomingData === "string") {
      var data = JSON.parse(incomingData);
      if (!data.hasOwnProperty("msgType")) throw "recieved message without msgType!";
      
      var handler = this.handlers.get(data.msgType);
      if (handler !== undefined) {
        handler(data);
        return;
      }
      this.defaultHandler(data);
    } else {
      this.binaryHandler(incomingData);
    }
  }
  
  on(msgType: string, callback: {(msg: any): void}): void {
    this.handlers.set(msgType, callback);
  }
  
  next(msgType: string, timeout?: number, timeoutMsg?: string): Promise<any> {
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
  constructor() {
    super();
  }
  
  abstract send(data: MessageType): void;
  sendJSON(object: any): void {
    this.send(JSON.stringify(object));
  }
}
