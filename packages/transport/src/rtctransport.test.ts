import 'mocha';
import { expect } from 'chai';

import {Transport, MessageType} from './transport';
import WebRTCTransport from './rtctransport';

class DirectTransportSide extends Transport {
  callback: {(data: MessageType): void};
  
  send(data: MessageType) {
    this.callback(data);
  }
}

class DirectTransport {
  left: DirectTransportSide = new DirectTransportSide();
  right: DirectTransportSide = new DirectTransportSide();
  constructor() {
    this.left.callback = this.right.srvMsg.bind(this.right);
    this.right.callback = this.left.srvMsg.bind(this.left);
  }
}

// race conditions? idc, doesn't matter here
describe('webrtc transport test', () => {
  let directTransport: DirectTransport = undefined;
  let left: WebRTCTransport = undefined;
  let right: WebRTCTransport = undefined;
  before(()=> {
    directTransport = new DirectTransport();
  });
  
  it('should construct', () => {
    left = new WebRTCTransport();
    right = new WebRTCTransport();
  });
  
  it('should setup', () => {
    left.setTransport(directTransport.left);
    right.setTransport(directTransport.right);
  });
  
  it('should negotiate & connect', () => {
    return Promise.all([left.sendOffer(), left.open.promise(), right.open.promise()]);
  }).timeout(1000);
  
  it('should pass regular messages', async () => {
    let testMsg = {
      msgType: "test",
      string: "this is a test message",
    };
    left.sendJSON(testMsg);
    let msg2 = await right.next("test");
    expect(msg2).to.eql(testMsg);
    
    right.sendJSON(testMsg);
    let msg1 = await left.next("test");
    expect(msg1).to.eql(testMsg);
  }).timeout(1000);
  
  it('should pass binary messages', async () => {
    let testMsg = new Uint8Array([123,124,125,126,127,128]).buffer; // needs arraybuffer
    left.send(testMsg);
    let msg2 = await new Promise((resolve, reject) => {
      right.binaryHandler = resolve; 
    });
    expect(msg2).to.eql(testMsg);
    
    right.send(testMsg);
    let msg1 = await new Promise((resolve, reject) => {
      left.binaryHandler = resolve; 
    });
    expect(msg1).to.eql(testMsg);
  }).timeout(1000);
  
  it('should close gracefully', () => {
    return Promise.all([left.disconnect(), right.disconnect()]);
  }).timeout(1000);
});
