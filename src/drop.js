'use strict';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import QRCode from 'qrcode.react';
import StreamSaver from 'streamsaver';

import "./drop.scss";
import {FakeFile, FakeClient} from "./TestObject.js";

import * as WebStr from "./transport/webstr.js";
import WebSocketTransport from "./transport/wstransport.js";
import WebRTCTransport from "./transport/rtctransport.js";


class FileDisplay extends Component {
  render() {
    return (
      <div>
        <div>
          <div>
            {this.props.file.name}
          </div>
          <div>
            {this.props.file.size}
          </div>
        </div>
      </div>
    );
  }
}

function StateDisplay(props) {
  return (
    <div>
      <div>
        <div className="progress">
          <div className="progress-bar" role="progressbar" style={{ width: props.percentDone}} aria-valuenow={props.percentDone} aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
      <div className="text-center">
        {props.transferState /* transfer status */}
      </div>
    </div>
  );
}

// calls onFileDrop with a SyntheticFile object containing a stream
class FileDrop extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
    };
    
    this.handleEvent = this.handleEvent.bind(this);
    this.handleSubmitText = this.handleSubmitText.bind(this);
    this.onDrop = this.onDrop.bind(this);
  }
  
  handleEvent(event) {
    this.setState({text: event.target.value});
  }
  
  handleSubmitText(event) {
    event.preventDefault();
    console.log(this.state.text);
    var textBlob = new Blob(this.state.text, {type: "text/plain"});
    
    var file = {
      name: "paste.txt",
      size: textBlob.size,
    };
    this.props.onFileDrop(file, WebStr.fromBlob(textBlob));
    
    this.setState({text: ""});
  }
  
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  onDrop(event) {
    this.preventDefaults(event);
    console.log(event);
    
    console.log(event.dataTransfer);
    
    let fileList = [];
    
    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if( event.dataTransfer.items[i].kind === "file" ) {
          let file = event.dataTransfer.items[i].getAsFile();
          fileList.push(file);
        }
      }
    } else {
      fileList.push(event.dataTransfer.files);
    }
    console.log(fileList);
    
    if (fileList.length >= 1) {
      if (fileList.length > 1) console.error("more than one file not supported!");
      this.dropFile(fileList[0]);
    }
  }
  
  dropFile(file) {
    let fileInfo = {
      name: file.name,
      size: file.size,
    }
    let readableStream = WebStr.fromBlob(file);
    this.props.onFileDrop(fileInfo, readableStream);
  }
  
  render() {
    return (
      <div className="fileDrop"
          onDragEnter={this.preventDefaults}
          onDragOver={this.preventDefaults}
          onDragLeave={this.preventDefaults}
          onDrop={this.onDrop}
      >
        <div>Drop File </div>
        <div id="drop">
          <form>
            <input type="file" id="fileElem"/>
            <input type="button" value="Attach File"/>
          </form>
        </div>
        <div>(or paste text!)</div>
        <form onSubmit={this.handleSubmitText}>
          <textarea value={this.state.text} onChange={this.handleEvent}></textarea>
          <button>Submit</button>
        </form>
      </div>
    );
  }
}

class ShaderDropDropper extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      fileInfo: null,
      transferState: "Not Connected",
      hasFile: false,
      id: null,
      sending: false,
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
    let fileComponent = null;
    if (this.state.hasFile) {
      fileComponent = <FileDisplay file={this.state.fileInfo} />;
    } else {
      fileComponent = <FileDrop onFileDrop={this.onFileDrop.bind(this)}/>
    }
    
    let idDisplay = null;
    if (this.state.id != null) {
      idDisplay = <QRCode value={this.state.id}/>;
    }
    return (
      <div id="reactapp">
        <nav className="navbar navbar-light bg-light">
          <div className="container-fluid">
            <a className="navbar-brand" href="#">shaderDrop</a>
            <status-indicator intermediary></status-indicator>
          </div>
        </nav>
        <div id="client">
          <div id="qr">{idDisplay}</div>
          <StateDisplay transferState={this.state.transferState} percentDone={50}/>
          {fileComponent}
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
    if (!this.state.sending) {
      console.log("window.isSecureContext : " + window.isSecureContext);
      let readStream = WebStr.createReadableStream(this.wrtc);
      let fileInfo = await this.wrtc.next('fileInfo');
      this.transferMsg("Connected");
      this.setState({fileInfo : fileInfo});
      let writeStream = StreamSaver.createWriteStream(fileInfo.name, {
        size: fileInfo.size,
      });
      
      await readStream.pipeTo(writeStream);
      this.transferMsg("Done!");
    } else {
      await this.wrtc.open.promise();
      let fileInfo = this.state.fileInfo;
      this.wrtc.sendJSON(fileInfo);
      let writeStream = WebStr.createWritableStream(this.wrtc);
      await this.stream.pipeTo(writeStream);
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
}

ReactDOM.render(<ShaderDropDropper/>, document.getElementById('root'));
