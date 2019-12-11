'use strict';
import stream from 'stream';
import {BinMsgType} from './transport';
import WebRTCTransport from './rtctransport';

// node.js streams adapter for the message interface we have

// reads a stream and passes it to sendMsg (webrtc)
export class RTCWriteStream extends stream.Writable {
  transport: WebRTCTransport;
  total: number = 0;
  constructor(transport: WebRTCTransport) {
    super({
      highWaterMark: 16384, // 16KiB
      decodeStrings: true,
    });
    this.transport = transport;
    
    // @ts-ignore this is bad practice anyway.... sooooo.....
    global.writeStream = this;
  }
  
  _write(chunk, encoding, callback) {
    //console.error(chunk);
    // fragment chunk
    const fragSize = 16384; // 16KiB (most common RTCDataChannel Message Maximum is 16KiB)
    let currentPromise = this.transport.bufferLow();
    
    let bytePos = 0;
    while (bytePos < chunk.length) {
      let sendBytes = Math.min(fragSize, chunk.length - bytePos);
      let fragChunk = chunk.subarray(bytePos, bytePos+sendBytes);
      currentPromise = currentPromise.then(() => {
        //console.error(fragChunk);
        this.transport.send(fragChunk);
        return this.transport.bufferLow();
      });
      //this.transport.sendMsg(fragChunk);
      bytePos += sendBytes;
    }
    currentPromise.then(() => callback()).catch((reason) => callback(new Error(reason)));
    //callback();
  }
  
  /*_write(chunk, encoding, callback) {
    this.total += chunk.length
    console.log(this.total);
    callback();
  }*/
  
  _final(callback) {
    this.transport.bufferEmpty().then(() => {
      this.transport.disconnect();
      callback();
    });
  }
}

// gets a message (webrtc) and passes it to a stream 
export class RTCReadStream extends stream.Readable {
  transport: WebRTCTransport;
  constructor(transport: WebRTCTransport) {
    super({
      highWaterMark: 16384, // doesn't matter, we're gonna ram right through it anyways
    });
    this.transport = transport;
    this.transport.binaryHandler = this.onMessageRecv.bind(this);
    this.transport.close.register(() => {
      this.push(null); // ends reading
    });
  }
  
  _read(size: number) {
    // do nothing
  }
  
  onMessageRecv(data: BinMsgType) {
    //console.error(data);
    let uint8View = new Uint8Array(data);
    this.push(uint8View);
  }
}





