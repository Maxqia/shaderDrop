'use strict';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import QRCode from 'qrcode.react';

import "./drop.scss";
import {FakeFile, FakeClient} from "./TestObject.js";



class FileDisplay extends Component {
  render() {
    return (
      <div className="container-fluid border total-file olistitm">
        <div className="row file-and-code">
          <div className="col-4 file-name">
            {this.props.file.name}
          </div>
          <div className="col-8 code">
            <div className="container">
              <div className="row">
                <div className="col"><QRCode value={this.props.file.stringID}/></div>
                <div className="col">grab link : {this.props.file.stringID}</div>
              </div>
              <div className="row">
                <div className="container">
                  <div className="row"><div className="col text-center">Transfer Status</div></div>
                  <div className="row"><div className="col text-center">0% - Not Started</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col">
            keep open until it transfers
          </div>
          <div className="col">
            <div className="container">
              <div className="row justify-content-end">
                <div className="col-auto text-right">connected directly</div>
                <div className="col-auto"><status-indicator intermediary></status-indicator></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class ClientDisplay extends Component {
  render() {
    return (
      <div id="client">
        <div>
          <QRCode value={this.props.client.stringID}/>
        </div>
        <div>
          <div>
            {this.props.client.file.name}
          </div>
          <div>
            {this.props.client.file.size}
          </div>
        </div>
        <div>
          {/* progress bar */}
        </div>
        <div>
          {"Not Connected" /* transfer status */}
        </div>
      </div>
    );
  }
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
      type: textBlob.type,
      stream: textBlob.stream(),
    };
    this.props.onFileDrop(file);
    
    this.setState({text: ""});
  }
  
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  onDrop(event) {
    this.preventDefaults(event);
    console.log(event);
  }
  
  render() {
    return (
      <div className="container-fluid border olistitm">
        <div>Drop File (or paste text!)</div>
        <div id="drop" 
          onDragEnter={this.preventDefaults}
          onDragOver={this.preventDefaults}
          onDragLeave={this.preventDefaults}
          onDrop={this.onDrop}
        >
          <form>
            <input type="file" id="fileElem"/>
            <label htmlFor="fileElem">Select File</label>
          </form>
        </div>
        <form onSubmit={this.handleSubmitText}>
          <textarea value={this.state.text} onChange={this.handleEvent}></textarea>
          <button>Submit</button>
        </form>
      </div>
    );
  }
}

class ShowClient extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
    };
    
    this.handleEvent = this.handleEvent.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  
  handleEvent(event) {
    this.setState({text: event.target.value});
  }
  
  handleSubmit(event) {
    event.preventDefault();
    console.log(this.state.text);
    this.setState({text: ""});
  }
  
  render() {
    return (
      <div className="olistitm">
        <div>Scan to add files</div>
        <QRCode value={this.props.client.stringID}/>
        <div>or enter id of file directly</div>
        <form onSubmit={this.handleSubmit}>
          <input type="text" value={this.state.text} onChange={this.handleEvent} />
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
      client: FakeClient,
    };
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
        <ClientDisplay client={this.state.client}/>
      </div>
    );
  }
}

ReactDOM.render(<ShaderDropDropper/>, document.getElementById('root'));
