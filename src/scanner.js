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
  if (props.client.sending) {
    return (
      <button onClick={() => props.selectClient(props.client)}>
        {props.client.file.name}{" "}{props.client.file.size}{" "}{"sending"}
      </button>
    );
  } else {
    return (
      <button onClick={() => props.selectClient(props.client)}>
        {props.client.stringID}{" "}{"recieving"}
      </button>
    );
  }
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
      clients: [],
      selectedClient: null,
    };
    this.selectClient = this.selectClient.bind(this);
    this.handleScan = this.handleScan.bind(this);
    
    this.transport = new WebSocketTransport();
    this.transport.connect();
    this.transport.on("clientInfo", this.clientInfoHandler.bind(this));
  }
  
  handleScan(content) {
    if (content == null) return;

    let client = this.getClient(content);
    if (client != null) {
      this.connectToSelected(client);
    } else { // new client!
      this.transport.sendJSON({
        msgType: "subscribe",
        stringID: content,
      });
    }
  }
  
  hasClient(id) {
    for (let client of this.state.clients) {
      if (client.stringID === id) {
        return true;
      }
    }
    return false;
  }
  
  getClient(id) {
    for (let client of this.state.clients) {
      if (client.stringID === id) {
        return client;
      }
    }
    return null;
  }
  
  clientInfoHandler(data) {
    if (data.clientInfo === "invalid") return;
    this.updateClient(data.clientInfo);
  }
  
  updateClient(client) {
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
      this.transport.sendToID(client.stringID, JSON.stringify({
          msgType : "scanned",
      }));
      this.connectToSelected(client);
    }
    
    this.setState({
      clients: clients,
    });
  }
  
  connectClients(cli1, cli2) {
    this.transport.sendToID(cli1.stringID, JSON.stringify({
      msgType : "connect",
      clientID : cli2.stringID,
    }));
  }
  
  connectToSelected(client) {
    if (this.state.selectedClient != null) {
      this.connectClients(this.state.selectedClient, client);
    } else {
      this.selectClient(client);
    }
  }
  
  selectClient(client) {
    if (this.state.selectedClient != client) {
      this.setState({selectedClient: client});
    } else {
      this.setState({selectedClient: null});
    }
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


