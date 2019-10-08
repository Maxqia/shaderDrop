'use strict';

const stream = require('stream');
// node.js streams adapter for the message interface we have


// reads a stream and passes it to sendMsg (webrtc)
export class RTCWriteStream extends stream.Writable {
  constructor(transport) {
    super({
      highWaterMark: 8192, // 8KiB (most common RTCDataChannel Maximum is 16KiB)
      decodeStrings: true,
    });
    this.transport = transport;
  }
  
  _write(chunk, encoding, callback) {
    this.transport.bufferLow().then(() => {
      this.transport.sendMsg(chunk);
    });
  }
}

// gets a message (webrtc) and passes it to a stream 
export class RTCReadStream extends stream.Readable {
  constructor(transport) {
    super({
      highWaterMark: 16384; // doesn't matter, we're gonna ram right through it anyways
    });
    this.transport = transport;
    this.transport.msgRecv = this.onMessageRecv.bind(this);
  }
  
  _read(size) {
    // do nothing
  }
  
  onMessageRecv(data) {
    this.push(data);
  }
}





