'use strict';
//import adapter from 'webrtc-adapter';
import {RTCPeerConnection, RTCSessionDescription, RTCIceCandidate} from 'wrtc';

import client from './client.js';

var targetID = null;
var pc = null;
var dc = null;

function msgRecv(id, incomingData) {
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "recieved message without msgType!";
    
    if (typeof targetID === 'undefined') {
      switch(data.msgType) {
        case "connect":
          newPeerConnection(data.clientID);
          sendOffer().catch(reportError);
          break;
        case "offer":
          newPeerConnection(id);
          sendAnswer(data.sdp).catch(reportError);
          break;
      };
    }
    
    if (id != targetID) return;
    switch(data.msgType) {
      case "new-ice-candidate":
        var candidate = new RTCIceCandidate(data.candidate);
        pc.addIceCandidate(candidate).catch(reportError);
        break;
      case "answer":
        var desc = new RTCSessionDescription(data.sdp);
        pc.setRemoteDescription(desc).catch(reportError);
        break;
    }
}

function send(object) {
  client.sendMsg(targetID, JSON.stringify(object));
}

function reportError(error) {
  console.error(error);
}

function newPeerConnection(newID) {
    targetID = newID;
    pc = new RTCPeerConnection ({
      iceServers: [
        {
          urls: "stun:stun.stunprotocol.org",
        },
      ],
    });
    pc.onicecandidate = handleIceCandidateEvent;
    pc.ondatachannel = recieveChannel;
    recieveChannel(pc.createDataChannel('stuff', { ordered: true }));
}

async function sendOffer() {
  var offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  send({
    msgType:"offer",
    sdp: pc.localDescription,
  });
}

async function sendAnswer(sdp) {
  var desc = new RTCSessionDescription(sdp);
  await pc.setRemoteDescription(desc);
  var answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  send({
    msgType: "answer",
    sdp: answer,
  }); 
}

function handleIceCandidateEvent(event) {
  if (event.candidate) {
    send({
      msgType: "new-ice-candidate",
      candidate: event.candidate,
    });
  }
}

function recieveChannel(channel) {
  dc = channel;
  dc.onopen = onChannelChange;
  dc.onclose = onChannelChange;
}

function onChannelChange() {
  console.log("channel change" + dc.readyState);
}

client.msgRecv = msgRecv;
export { msgRecv };
