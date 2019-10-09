'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import Instascan from '@eventstag/instascan';

import "./scanner.scss";
import WebSocketTransport from './wstransport.js';
import {FakeClient} from './TestObject.js';

class QRReader extends React.Component {
  constructor(props) {
    super(props);
  }
  
  componentDidMount() {
    this.scanner = new Instascan.Scanner({
      video: document.getElementById('preview'),
      mirror: false,
    });
    this.scanner.addListener('scan', (data) => {
      console.log(data);
      this.props.onScan(data);
    });
    Instascan.Camera.getCameras().then((cameras) => {
      if (cameras.length > 0) {
        this.scanner.start(cameras[1]);
      } else {
        this.props.onError('No cameras found.');
      }
    }).catch(function (e) {
      this.props.onError(e);
    });
  }
  
  render() {
    return (<video id="preview" className={this.props.className}></video>);
  }
}

function Client(props) {
  return (
    <button onClick={() => props.selectClient(props.client.stringID)}>
      {props.client.stringID}{" "}{props.client.sending ? "sending" : "recieving"}
    </button>
  );
}

function File(props) {
  return (
    <button>
      "This is a file"
    </button>
  );
}

class ShaderDropScanner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clients: [FakeClient],
      selectedClient: null,
    };
    this.selectClient = this.selectClient.bind(this);
    this.handleScan = this.handleScan.bind(this);
    
    this.transport = new WebSocketTransport();
    this.transport.connect();
  }
  
  
  handleScan(content) {
    if (content == null) return;
    
    var client = {
      stringID: content,
      sending: true,
    };
    
    if (this.state.selectedClient != null) {
      this.connectClients(this.state.selectedClient, client);
    }
    
    this.addClient(client);
  }

  addClient(client) {
    if (this.state.clients.includes(client)) return;
    console.log("new client: " + client);
    
    this.setState({
      clients: this.state.clients.concat(client),
    });
    this.transport.sendMsg(client.stringID, JSON.stringify({
        msgType : "scanned",
    }));
    
    if (this.state.selectedClient == null) {
      this.selectClient(client);
    }
  }
  
  connectClients(cli1, cli2) {
     this.transport.sendMsg(cli1.stringID, JSON.stringify({
        msgType : "connect",
        clientID : cli2.stringID,
     }));
  }
  
  selectClient(client) {
    this.setState({selectedClient: client});
  }
  
  render() {
    let clientList = this.state.clients.map((client) => {
      return (<li key={client.stringID}> <Client client={client} selectClient={this.selectClient}/> </li>);
    });
    
    return (
      <div id="reactapp">
        <div className="qrContainer">
          <QRReader 
            onError={(error) => console.error(error)}
            onScan={(data) => this.handleScan(data)}
            facingMode="environment"
          />
        </div>
        <div id="lists">
          <div className="list">
            <h1>Clients</h1>
            <ul>{clientList}</ul>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<ShaderDropScanner/>, document.getElementById('root'));


