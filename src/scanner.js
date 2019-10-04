'use strict';
import React from 'react';
import ReactDOM from 'react-dom';

const client = require("./client.js");
const Instascan = require("@eventstag/instascan");


class QRReader extends React.Component {
  constructor(props) {
    super(props);
  }
  
  componentDidMount() {
    this.scanner = new Instascan.Scanner({
      video: document.getElementById('preview'),
      mirror: false,
    });
    this.scanner.addListener('scan', this.props.onScan);
    Instascan.Camera.getCameras().then((cameras) => {
      if (cameras.length > 0) {
        this.scanner.start(cameras[1]);
      } else {
        console.error('No cameras found.');
      }
    }).catch(function (e) {
      console.error(e);
    });
  }
  
  render() {
    return (<video id="preview"></video>);
  }
}

function Client(props) {
  return (
    <button onClick={() => props.selectClient(props.id)}>
      {props.id}
    </button>
  );
}

function File(props) {
  return (
    <button>
    </button>
  );
}

class ShaderDropScanner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clients: [],
      files: [],
      selectedObject: null,
      isClient: true,
    };
    this.selectClient = this.selectClient.bind(this);
  }
  
  
  handleScan(content) {
    if (content == null) return;
    
    if (this.state.selectedObject != null && this.state.isClient) {
      connectClients(this.state.selectedObject, content);
    }
    
    this.addClient(content);
  }

  addClient(ID) {
    if (this.state.clients.includes(ID)) return;
    console.log("new client: " + ID);
    this.setState({
      clients: this.state.clients.concat([ID]),
    });
    client.sendMsg(ID, JSON.stringify({
        msgType : "scanned",
    }));
  }
  
  selectClient(client) {
    this.setState({selectedObject: client, isClient: true});
  }
  
  render() {
    const fileList = this.state.files.map((file) => {
      return (<li> <File/> </li>);
    });
    const clientList = this.state.clients.map((id) => {
      return (<li key={id}> <Client id={id} selectClient={this.selectClient}/> </li>);
    });
    
    return (
      <div>
        <QRReader
          onError={(error) => console.error(error)}
          onScan={(data) => this.handleScan(data)}
          facingMode="environment"
        />
        <ul>{fileList}</ul>
        <ul>{clientList}</ul>
      </div>
    );
  }
}

ReactDOM.render(<ShaderDropScanner/>, document.getElementById('root'));

function connectClients(cli1, cli2) {
   client.sendMsg(cli1, JSON.stringify({
      msgType : "connect",
      clientID : cli2,
   }));
   client.sendMsg(cli2, JSON.stringify({
      msgType : "connect",
      clientID : cli1,
   }));
}
