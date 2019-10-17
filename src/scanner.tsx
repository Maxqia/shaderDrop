'use strict';
import React from 'react';
import ReactDOM from 'react-dom';

import "./scanner.scss";
import WebSocketTransport from './transport/wstransport.js';
import { FileInfo, Client, isValidClient, FakeClient} from './TestObject';

import { QRReader } from './components/QRReader.tsx';

interface ClientProps {
  client: Client;
}

const ClientInfo: React.FC<ClientProps> = (props) => {
  if (props.client.sending) {
    return (
      <button>
        {props.client.file.name}{" "}{props.client.file.size}{" "}{"sending"}
      </button>
    );
  } else {
    return (
      <button>
        {props.client.stringID}{" "}{"recieving"}
      </button>
    );
  }
}

interface ScannerState {
  clients: Client[];
  selectedClient: number;
}

class ShaderDropScanner extends React.Component<{}, ScannerState> {
  lastScannedClient: string = null;
  transport: WebSocketTransport = new WebSocketTransport();
  constructor(props) {
    super(props);
    this.state = {
      clients: [],
      selectedClient: null,
    };
    this.selectClient = this.selectClient.bind(this);
    this.handleScan = this.handleScan.bind(this);
    
    this.transport.connect();
    this.transport.on("clientInfo", this.clientInfoHandler.bind(this));
  }
  
  handleScan(content: string) {
    if (content == null) return;

    this.lastScannedClient = content;
    let client = this.getClient(content);
    if (client == null) { // new client!
      this.transport.sendJSON({
        msgType: "subscribe",
        stringID: content,
      });
    }
  }
  
  hasClient(id: string) {
    for (let client of this.state.clients) {
      if (client.stringID === id) {
        return true;
      }
    }
    return false;
  }
  
  getClient(id: string) {
    for (let client of this.state.clients) {
      if (client.stringID === id) {
        return client;
      }
    }
    return null;
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
      this.transport.sendToID(client.stringID, JSON.stringify({
          msgType : "scanned",
      }));
    }
    
    this.setState({
      clients: clients,
      selectedClient: this.state.clients.length <= 0 ? 0 : this.state.selectedClient,
    });
  }
  
  connectClients(cli1: Client, cli2: Client) {
    this.transport.sendToID(cli1.stringID, JSON.stringify({
      msgType : "connect",
      clientID : cli2.stringID,
    }));
  }
  
  selectClient(idxNum: number) {
    if (isNaN(idxNum)) return;
    if (this.state.clients.length <= 0) return;
    if (idxNum < 0) return;
    if (idxNum >= this.state.clients.length) return;
    this.setState({selectedClient: idxNum});
  }
  
  left() {
    this.selectClient(this.state.selectedClient - 1);
  }
  
  right() {
    this.selectClient(this.state.selectedClient + 1);
  }
  
  send() {
    if (this.lastScannedClient != null) {
      let client = this.getClient(this.lastScannedClient);
      if (client != null) {
        this.connectClients(this.state.clients[this.state.selectedClient], client);
      }
    }
  }
  
  render() {
    var clientSelected = <button>No Clients Available</button>
    if (this.state.selectedClient != null) {
      clientSelected = <ClientInfo client={this.state.clients[this.state.selectedClient]}/>;
    }
    
    return (
      <div id="reactapp">
        <QRReader 
          onError={(error) => console.error(error)}
          onScan={(data) => this.handleScan(data)}
          facingMode="environment"
        />
        <div id="bottomBar">
          <div id="clientSelector">
            <button className="bt" id="leftBt" onClick={() => this.left()}>&lt;</button>
            {clientSelected}
            <button className="bt" id="rightBt" onClick={() => this.right()}>&gt;</button>
          </div>
          <div id="sendDiv">
            <button onClick={() => this.send()}>Connect</button>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<ShaderDropScanner/>, document.getElementById('root'));


