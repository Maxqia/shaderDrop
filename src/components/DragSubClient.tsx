'use strict';
import React from 'react';
import ReactDOM from 'react-dom';

import WebSocketTransport from '../transport/wstransport';
import { FileInfo, Client } from '../TestObject';

import { QRReader } from './QRReader';
import Back from "./Back";

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

interface DragProps {
  clients: Client[];
  selectedClient: number;
  
  selectClient: any;
  subscribeToClient: any; //TODO function defs
  connectClients: any;
}

interface DragState {
  lastScannedClient: string;
}

export default class DragSubClient extends React.Component<DragProps, DragState> {
  constructor(props) {
    super(props);
    this.state = {
      lastScannedClient: null,
    };
    this.handleScan = this.handleScan.bind(this);
  }
  
  handleScan(content: string) {
    if (content == null) return;

    this.setState({lastScannedClient: content});
    this.subscribeToClient(content);
  }
  
  left() {
    this.props.selectClient(this.props.selectedClient - 1);
  }
  
  right() {
    this.props.selectClient(this.props.selectedClient + 1);
  }
  
  
  subscribeToClient(content: string) {
    let client = this.getClient(content);
    if (client == null) { // new client!
      this.props.subscribeToClient(content);
    }
  }
  
  hasClient(id: string) {
    for (let client of this.props.clients) {
      if (client.stringID === id) {
        return true;
      }
    }
    return false;
  }
  
  getClient(id: string) {
    for (let client of this.props.clients) {
      if (client.stringID === id) {
        return client;
      }
    }
    return null;
  }
  
  send() {
    if (this.state.lastScannedClient != null) {
      let client = this.getClient(this.state.lastScannedClient);
      if (client != null) {
        let length = this.props.connectClients(this.props.clients[this.props.selectedClient], client);
        let selected: number = null;
        if(length >= 1) {
          selected = 0;
        }
        this.props.selectClient(selected);
      }
    }
  }
  
  render() {
    var clientSelected = <button>No Clients Available</button>
    if (this.props.selectedClient != null) {
      clientSelected = <ClientInfo client={this.props.clients[this.props.selectedClient]}/>;
    }
    
    return (
      <div className="cameraflex fullscreen">
        <QRReader 
          onError={(error) => console.error(error)}
          onScan={(data) => this.handleScan(data)}
          facingMode="environment"
          frontFacing={false}
        />
        <div className="bottomBar">
          <div className="actionDiv">
            <div><Back>Back</Back></div>
            <div><button className="send" onClick={() => this.send()}><img src="iconfinder_ic_file_upload_48px_352345.svg"/></button></div>
            <div><img className="flip" src="iconfinder_rotate_on_1372387.svg"/></div>
          </div>
          <div className="clientSelector">
            <button className="leftBt" onClick={() => this.left()}>&lt;</button>
            {clientSelected}
            <button className="rightBt" onClick={() => this.right()}>&gt;</button>
          </div>
        </div>
      </div>
    );
  }
}
