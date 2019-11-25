'use strict';
import React from 'react';
import { Link } from "react-router-dom";

import { Client } from "../TestObject";
import { QRReader } from './QRReader';

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
      <div className="dragcomponent">
        <QRReader 
          onError={(error) => console.error(error)}
          onScan={(data) => this.handleScan(data)}
          facingMode="environment"
          frontFacing={false}
        />
        <div className="bottomBar">
          <div className="actionDiv">
            <Link to="/">Back</Link> {/* TODO better history handling */}
            <img className="flip" src="iconfinder_rotate_on_1372387.svg"/>
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
