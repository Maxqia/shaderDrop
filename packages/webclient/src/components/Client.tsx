'use strict';
import React, {Component} from 'react';
import { History } from 'history';
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";

var streams = require("web-streams-polyfill");
import StreamSaver from 'streamsaver';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
const toPolyfillReadable = createReadableStreamWrapper(ReadableStream);


import bytes from 'bytes';
import classNames from 'classnames';

import { Client, isValidClient, FakeFile, FakeClient, FileInfo } from "@shaderdrop/transport/src/types";
import * as WebStr from "@shaderdrop/transport/src/webstr";
import WebSocketTransport from "@shaderdrop/transport/src/wstransport";
import WebRTCTransport from "@shaderdrop/transport/src/rtctransport";

import DropSubClient from "./DropSubClient";
import DragSubClient from "./DragSubClient";
import PushPull from "./PushPullSubClient";



interface ClientState {
  id: string;
  
  sending: boolean;
  hasFile: boolean;
  fileInfo: FileInfo;
  transferState: string;
  transferPercent: number;
  
  clients: Client[]; /* subscribed clients */
  selectedClient: number;
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
      id: null,
      fileInfo: null,
      hasFile: false,
      sending: false,
      transferState: "Not Connected",
      transferPercent: 0,
      clients: [],
      selectedClient: null,
    };
    
    this.updateServer = this.updateServer.bind(this);
    
    this.ws = new WebSocketTransport();
    this.wrtc = new WebRTCTransport(); 
    this.ws.msgRecv = this.newClientMsgRecv.bind(this);
    this.ws.id.register(this.getID.bind(this));
    this.ws.on("clientInfo", this.clientInfoHandler.bind(this));
    
    this.ws.connect();
  }
  
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route path="/pull">
            <PushPull self={this.state.id} connectClients={this.connectClients.bind(this)}/>
          </Route>
          <Route path="/push">
            <PushPull self={this.state.id} connectClients={this.connectClients.bind(this)}/>
          </Route>
          <Route path="/drag">
            <DragSubClient clients={this.state.clients} selectedClient={this.state.selectedClient} selectClient={this.selectClient.bind(this)} subscribeToClient={this.subscribeToClient.bind(this)} connectClients={this.connectClients.bind(this)}/>
          </Route>
          <Route path="/">
            <DropSubClient id={this.state.id} fileInfo={this.state.fileInfo} transferState={this.state.transferState} transferPercent={this.state.transferPercent} onFileDrop={this.onFileDrop.bind(this)}/>
          </Route>
        </Switch>
      </BrowserRouter>
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
      if (!(stream instanceof ReadableStream)) {
        this.stream = toPolyfillReadable(stream) as ReadableStream;
      } else {
        this.stream = stream;
      }
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
  
  
  /* Subscription Handling */
  subscribeToClient(content: string) {
    this.ws.sendJSON({
      msgType: "subscribe",
      stringID: content,
    });
  }

  clientInfoHandler(data: any) {
    if (isValidClient(data.clientInfo)) {
      this.updateClient(data.clientInfo);
    }
  }
  
  updateClient(client: Client) {
    let clients = this.state.clients.slice();
    let replacedClient = false;
    for (let i = 0; i < clients.length; i++) {
      if (client.stringID === clients[i].stringID) {
        clients[i] = client;
      }
    }
    
    if (!replacedClient) {
      console.log("new client: " + client.stringID);
      clients = clients.concat(client);
      this.ws.sendToID(client.stringID, JSON.stringify({
          msgType : "scanned",
      }));
    }
    
    this.setState({
      clients: clients,
      selectedClient: this.state.clients.length <= 0 ? 0 : this.state.selectedClient,
    });
  }
  /* end Subscription Handling */
  
  // returns how many clients left after removing these two
  connectClients(cli1: Client, cli2: Client): number {
    this.ws.sendToID(cli1.stringID, JSON.stringify({
      msgType : "connect",
      clientID : cli2.stringID,
    }));
    
    // remove the newly connected clients from clients array
    let cArr: Client[] = this.state.clients.slice();
    cArr = cArr.filter((elem) => elem != cli1);
    cArr = cArr.filter((elem) => elem != cli2);
    
    this.setState({
      clients: cArr,
    });
    return cArr.length;
  }
  
  selectClient(idxNum: number) {
    if (isNaN(idxNum)) return;
    if (this.state.clients.length <= 0) return;
    if (idxNum < 0) return;
    if (idxNum >= this.state.clients.length) return;
    this.setState({selectedClient: idxNum});
  }
}

