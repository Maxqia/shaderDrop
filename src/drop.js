'use strict';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import StreamSaver from 'streamsaver';
import bytes from 'bytes';
import classNames from 'classnames';

import "./drop.scss";
import {FakeFile, FakeClient} from "./TestObject.js";

import * as WebStr from "./transport/webstr.js";
import WebSocketTransport from "./transport/wstransport.js";
import WebRTCTransport from "./transport/rtctransport.js";

import { IDDisplay, StateDisplay, FileDropDisplay } from "./components/Display.js";


class ShaderDropDropper extends Component {
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
    this.connectedID = null;
    this.ws.id.register(this.getID.bind(this));
    
    this.ws.connect();
  }
  
  render() {
    return (
      <div id="reactapp">
        <nav className="navbar navbar-light bg-light">
          <div className="container-fluid">
            <a className="navbar-brand" href="#">shaderDrop</a>
            <status-indicator intermediary></status-indicator>
          </div>
        </nav>
        <div className="client">
          <IDDisplay id={this.state.id}/>
          <StateDisplay transferState={this.state.transferState} percentDone={this.state.transferPercent}/>
          <FileDropDisplay file={this.state.fileInfo} onFileDrop={this.onFileDrop.bind(this)}/>
        </div>
      </div>
    );
  }

  getID(id) {
    this.setState({ id : id });
    this.updateServer();
  }
  
  updateServer() {
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
  
  setupWRTC(clientID) {
    this.wrtc.setTransport(this.ws.transport(clientID));
  }
  
  newClientMsgRecv(id, incomingData) {
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
  
  transferMsg(msg) {
    console.log(msg);
    this.setState({ transferState: msg });
  }
  
  async onNewRemote() {
    if (this.state.sending) {
      await this.wrtc.open.promise();
      this.transferMsg("Connected");
      let fileInfo = this.state.fileInfo;
      this.wrtc.sendJSON(fileInfo);
      let writeStream = WebStr.createWritableStream(this.wrtc);
      
      let progress = new WebStr.CountingStream(fileInfo.size, this.updateProgress.bind(this));
      this.stream.pipeTo(progress.writable);
      await progress.readable.pipeTo(writeStream);
      
      this.transferMsg("Done!");
    } else {
      console.log("window.isSecureContext : " + window.isSecureContext);
      let readStream = WebStr.createReadableStream(this.wrtc);
      let fileInfo = await this.wrtc.next('fileInfo');
      this.transferMsg("Connected");
      this.setState({fileInfo : fileInfo});
      let writeStream = StreamSaver.createWriteStream(fileInfo.name, {
        size: fileInfo.size,
      });
      
      let progress = new WebStr.CountingStream(fileInfo.size, this.updateProgress.bind(this));
      readStream.pipeTo(progress.writable);
      await progress.readable.pipeTo(writeStream);
      this.transferMsg("Done!");
    }
  }
  
  onFileDrop(fileInfo, stream) {
    fileInfo.msgType = "fileInfo";
    this.setState({
      fileInfo: fileInfo,
      sending: true,
      hasFile: true,
    }, this.updateServer);
    this.stream = stream;
  }
  
  updateProgress(percentDone, bps) {
    percentDone = percentDone * 100;
    this.setState({
      transferState: "Transfering : "+percentDone.toFixed(2)+"% ["+bytes(bps)+"/s]",
      transferPercent: percentDone,
    });
  }
}

ReactDOM.render(<ShaderDropDropper/>, document.getElementById('root'));
