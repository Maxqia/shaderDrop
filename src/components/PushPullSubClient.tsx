'use strict';
import React from 'react';
import { Link } from "react-router-dom";

import { Client } from "../TestObject";
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
            <div><img className="flip" src="iconfinder_rotate_on_1372387.svg"/></div>
          </div>
        </div>
      </div>
    );
  }
  
  handleScan(content: string) {
    if (content == null) return;
    this.props.connectClients({ stringID : content }, { stringID : this.props.self });
  }
}
