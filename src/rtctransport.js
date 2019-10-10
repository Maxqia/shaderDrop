'use strict';
//import adapter from 'webrtc-adapter';
import {RTCPeerConnection, RTCSessionDescription, RTCIceCandidate} from 'wrtc';

import {Transport} from './transport.js';
import {FutureEvent} from './event.js';

export default class WebRTCTransport extends Transport {
  constructor() {
    super();
    this.pc = null;
    this.dc = null;

    this.transport = new Transport();
    // public interface
    this.msgRecv = (msg) => console.error("default message handler called! : " + msg);
    this.sendMsg = this.sendMsg.bind(this);
    /* this.bufferLow */
    // end public interface
    
    this.bufferEvent = new FutureEvent();
    
    this.newPeerConnection();
  }
  
  // send object to signaling peer
  send(object) {
    this.transport.sendMsg(JSON.stringify(object));
  }
  
  setTransport(transport) {
    this.transport = transport;
    this.setupRecv();
  }
  
  setupRecv() {
    var reportError = (error) => this.log(error);
    this.transport.on("offer", (data) => this.sendAnswer(data.sdp).catch(reportError));
    this.transport.on("new-ice-candidate", (data) => {
      var candidate = new RTCIceCandidate(data.candidate);
      this.pc.addIceCandidate(candidate).catch(reportError);
    });
    this.transport.on("answer", (data) => {
      var desc = new RTCSessionDescription(data.sdp);
      this.pc.setRemoteDescription(desc).catch(reportError);
    });
  }
  
  newPeerConnection() {
    this.pc = new RTCPeerConnection ({
      iceServers: [
        {
          urls: "stun:stun.stunprotocol.org",
        },
      ],
    });
    this.pc.onicecandidate = this.handleIceCandidateEvent.bind(this);
    this.pc.ondatachannel = (event) => this.recieveChannel(event.channel);
  }
  
  // might be called twice...
  recieveChannel(channel) {
    this.dc = channel;
    
    this.dc.onopen = (event) => {
      this.log(event);
      this.open.fire();
    };
    this.dc.onclose = (event) => {
      this.log(event);
      this.close.fire();
    };
    this.dc.onmessage = (event) => this.srvMsg(event.data);
    
    this.dc.bufferedAmountLowThreshold = 5 * Math.pow(2,20) / 2; /*2.5MiB*/
    this.setupBufferEvent();
  }
  
  async sendOffer() {
    this.recieveChannel(this.pc.createDataChannel('stuff', { ordered: true }));
    var offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.send({
      msgType:"offer",
      sdp: this.pc.localDescription,
    });
  }

  async sendAnswer(sdp) {
    var desc = new RTCSessionDescription(sdp);
    await this.pc.setRemoteDescription(desc);
    var answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.send({
      msgType: "answer",
      sdp: answer,
    }); 
  }

  handleIceCandidateEvent(event) {
    if (event.candidate) {
      this.send({
        msgType: "new-ice-candidate",
        candidate: event.candidate,
      });
    }
  }
  
  sendMsg(data) {
    this.dc.send(data);
  }

  bufferLow() {
    this.setupBufferEvent();
    return new Promise((resolve, reject) => {
      var testFunc = () => {
        // "decreases to fall to or below"
        // add a lot more to stop race conditions between setting the handlers
        if (this.dc.bufferedAmount <= 2 * this.dc.bufferedAmountLowThreshold) {
          resolve();
          return;
        }
        
        // HACK, node.js' WebRTC implementation doesn't have onbufferedamountlow.......
        setTimeout(testFunc, 20); // theoretical throughput of 2gbps
      };
      this.bufferEvent.register(testFunc);
      testFunc();
    });
  }
  
  setupBufferEvent() {
    if (this.bufferEvent.resolved) {
      this.bufferEvent = new FutureEvent();
    }
    this.dc.onbufferedamountlow = this.bufferEvent.fire;
  }
  
  close() {
    this.dc.close();
  }
} 






