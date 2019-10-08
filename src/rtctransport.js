'use strict';
//import adapter from 'webrtc-adapter';
import {RTCPeerConnection, RTCSessionDescription, RTCIceCandidate} from 'wrtc';

export default class WebRTCTransport {
  constructor() {
    this.pc = null;
    this.dc = null;

    // public interface
    this.msgRecv = (msg) => ();
    this.sendMsg = this.sendMsg.bind(this);
    /* this.bufferLow */
    this.onClose = () => ();
    /* this.close */
    this.sigRecv = this.recv.bind(this);
    this.sigSend = null;
    // end public interface
    this.newPeerConnection();
  }
  
  start() {
    this.sendOffer();
    return this.onOpenPromise;
  }
  
  // send object to signaling peer
  send(object) {
    if (this.sigSend) {
      this.sigSend(JSON.stringify(object));
    } else {
      throw "no signaling partner";
    }
  }
  
  recv(msg) {
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "recieved message without msgType!";
    switch(data.msgType) {
      case "offer":
        this.sendAnswer(data.sdp).catch(reportError);
        break;
      case "new-ice-candidate":
        var candidate = new RTCIceCandidate(data.candidate);
        this.pc.addIceCandidate(candidate).catch(reportError);
        break;
      case "answer":
        var desc = new RTCSessionDescription(data.sdp);
        this.pc.setRemoteDescription(desc).catch(reportError);
        break;
    }
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
    this.pc.ondatachannel = this.recieveChannel.bind(this);
    this.recieveChannel(this.pc.createDataChannel('stuff', { ordered: true }));
  }
  
  recieveChannel(channel) {
    this.dc = channel;
    
    this.onOpenPromise = new Promise((resolve, reject) => {
      this.dc.onopen = (event) => {
        this.log(event);
        resolve();
      };
    });
    this.dc.onclose = (event) => {
      this.log(event);
      this.onClose();
    }
    this.dc.onmessage = this.onMsg.bind(this);
    
    this.dc.bufferedAmountLowThreshold = 65535; // 64 KiB
  }
  
  async sendOffer() {
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
  
  onMsg(event) {
    this.msgRecv(event.data);
  }
  
  bufferLow() {
    return new Promise((resolve, reject) => {
      if (this.dc.bufferedAmount < this.dc.bufferedAmountLowThreshold) {
        resolve();
      } else {
        this.dc.onbufferedamountlow = () => resolve();
      }
    });
  }
  
  close() {
    this.dc.close();
  }
} 






