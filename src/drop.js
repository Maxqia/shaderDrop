'use strict';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import QRCode from 'qrcode.react';

import "./drop.scss";
import {FakeFile} from "./TestObject.js";



class FileDisplay extends Component {
  render() {
    return (
      <div className="container-fluid border total-file">
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

class FileDrop extends Component {
  render() {
    return (
      <div></div>
    );
  }
}

class ShaderDropDropper extends Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <div>
        <nav className="navbar navbar-light bg-light">
          <div className="container-fluid">
            <a className="navbar-brand" href="#">shaderDrop - your files, delivered!!!</a>
          </div>
        </nav>
        <ul>
          <li><FileDisplay file={FakeFile}/></li>
          <li><FileDrop/></li>
        </ul>
      </div>
    );
  }
}

ReactDOM.render(<ShaderDropDropper/>, document.getElementById('root'));
