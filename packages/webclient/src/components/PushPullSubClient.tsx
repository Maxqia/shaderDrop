'use strict';
import React from 'react';
import { Link } from "react-router-dom";

import { Client } from "@shaderdrop/transport/lib/types";
import { QRReader } from './QRReader';
import Back from "./Back";

interface PushPullProps {
  self: string;
  connectClients: any;
}

export default class PushPull extends React.Component<PushPullProps, {}> {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleScan = this.handleScan.bind(this);
  }
  
  render() {
    return (
       <QRReader
          onError={(error) => console.error(error)}
          onScan={(data) => this.handleScan(data)}
       />
    );
  }
  
  handleScan(content: string) {
    if (content == null) return;
    this.props.connectClients({ stringID : content }, { stringID : this.props.self });
  }
}
