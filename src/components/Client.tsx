'use strict';
import React, {Component} from 'react';

import { StreamSaver } from '../transport/wsfill';
import bytes from 'bytes';
import classNames from 'classnames';

import { FakeFile, FakeClient, FileInfo } from "../TestObject";

import * as WebStr from "../transport/webstr";
import WebSocketTransport from "../transport/wstransport";
import WebRTCTransport from "../transport/rtctransport";

import DropSubClient from "./Drop";
import DragSubClient from "./Drag";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

interface ClientState {
  fileInfo: FileInfo;
  hasFile: boolean;
  id: string;
  sending: boolean;
  transferState: string;
  transferPercent: number;
}

/* The Main Logic for the Browser Client */
export default class ShaderDropClient extends React.Component<{},ClientState> {
  ws: WebSocketTransport;
  wrtc: WebRTCTransport;
  
  connectedID: string = null; // The Client We're currently connected to
  stream: ReadableStream = null; // The File We're Streaming (if we have it)
  
  constructor(props) {
    super(props);
    
    this.state = {
      fileInfo: null,
      hasFile: false,
      id: null,
      sending: false,
      transferState: "Not Connected",
      transferPercent: 0,
    };
    
    this.updateServer = this.updateServer.bind(this);
    
    this.ws = new WebSocketTransport();
    this.wrtc = new WebRTCTransport(); 
    this.ws.msgRecv = this.newClientMsgRecv.bind(this);
    this.ws.id.register(this.getID.bind(this));
    
    this.ws.connect();
  }
  
  render() {
    return (
      <Router>
        <Switch>
          <Route path="/drag">
            <DragSubClient/>
          </Route>
          <Route path="/">
            <DropSubClient id={this.state.id} fileInfo={this.state.fileInfo} transferState={this.state.transferState} transferPercent={this.state.transferPercent} onFileDrop={this.onFileDrop.bind(this)}/>
          </Route>
        </Switch>
      </Router>
    );
  }


  // handler for the id event
  getID(id: string): void {
    this.setState({ id : id });
    this.updateServer();
  }
  
  updateServer(): void {
    this.ws.sendJSON({
      msgType: "update",
      clientInfo: {
        stringID: this.state.id,
        publicKey: this.ws.publicKey,
        sending: this.state.sending,
        file: this.state.fileInfo,
      },
    });
  }
  
  setupWRTC(clientID: string): void {
    this.wrtc.setTransport(this.ws.transport(clientID));
  }
  
  newClientMsgRecv(id: string, incomingData: string): void {
    var data = JSON.parse(incomingData);
    if (!data.hasOwnProperty("msgType")) throw "recieved message without msgType!";
    
    if (this.connectedID) {
      console.error("recieved unwanted message :" + id + ":" + incomingData);
      return;
    }
    
    switch(data.msgType) {
      case "connect":
        this.connectedID = data.clientID;
        this.transferMsg("recieved request to connect to client: " + this.connectedID);
        this.setupWRTC(this.connectedID);
        this.wrtc.sendOffer().catch((error) => console.error());
        this.onNewRemote();
        break;
      case "offer":
        this.connectedID = id;
        this.transferMsg("recieved offer from client: " + this.connectedID);
        this.setupWRTC(this.connectedID);
        this.wrtc.transport.srvMsg(incomingData); // inject message back into wrtc
        this.onNewRemote();
        break;
      default:
        //console.error("recieved unknown message :" + id + ":" + incomingData);
    };
  }
  
  transferMsg(msg): void {
    console.log(msg);
    this.setState({ transferState: msg });
  }
  
  clientWaiting: boolean = false;
  async onNewRemote(): Promise<void> {
    if (this.state.hasFile) {
      await this.wrtc.open.promise();
      this.send();
    } else {
      this.wrtc.on("fileInfo", this.recv.bind(this));
      await this.wrtc.open.promise();
      this.transferMsg("Connected : Waiting for File...");
      this.clientWaiting = true;
    }
  }
  
  async send() {
    if (!this.state.sending) throw new Error("tried to send in wrong state!");
    this.transferMsg("Connected");
    let fileInfo = this.state.fileInfo;
    this.wrtc.sendJSON(fileInfo);
    let writeStream = WebStr.createWritableStream(this.wrtc);
    
    let progress = new WebStr.CountingStream(fileInfo.size, this.updateProgress.bind(this));
    this.stream.pipeTo(progress.writable);
    await progress.readable.pipeTo(writeStream);
    
    this.transferMsg("Done!");
  }
  
  async recv(fileInfo: File) {
    if (this.state.sending) throw new Error("tried to recieve in wrong state!");
    this.transferMsg("Got File!");
    this.setState({fileInfo : fileInfo});
    let readStream = WebStr.createReadableStream(this.wrtc);
    let writeStream = StreamSaver.createWriteStream(fileInfo.name, {
      size: fileInfo.size,
    });
    
    let progress = new WebStr.CountingStream(fileInfo.size, this.updateProgress.bind(this));
    readStream.pipeTo(progress.writable);
    await progress.readable.pipeTo(writeStream);
    this.transferMsg("Done!");
  }
  
  onFileDrop(fileInfo: FileInfo, stream: ReadableStream) {
    fileInfo.msgType = "fileInfo";
    this.setState({
      fileInfo: fileInfo,
      sending: true,
      hasFile: true,
    }, () => {
      this.stream = stream;
      this.updateServer();
      if (this.clientWaiting) {
        this.send();
      }
    });
  }
  
  updateProgress(percentDone: number, bps: number) {
    percentDone = percentDone * 100;
    
    let str: string = "";
    str += this.state.sending ? "Sending : " : "Recieving : ";
    str += percentDone.toFixed(2) + "% ";
    str += "["+bytes(bps)+"/s]";
    this.setState({
      transferState: str,
      transferPercent: percentDone,
    });
  }
}

