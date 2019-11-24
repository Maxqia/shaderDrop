'use strict';
import React, {Component} from 'react';

import { FileInfo } from "../TestObject";
import { FileDropFunc } from "./FileDrop";
import { IDDisplay, StateDisplay, FileDropDisplay } from "./Display";


declare global {
  namespace JSX {
    interface IntrinsicElements {
      "status-indicator": any;
    }
  }
}

interface DropperProps {
  id: string;
  
  fileInfo: FileInfo;
  transferState: string; // todo use a enum?
  transferPercent: number;
  
  onFileDrop: FileDropFunc;
}

export default class DropSubClient extends React.Component<DropperProps,{}> {
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <div id="reactapp" className="">
        <div className="max-width">
          <div className="">
            <nav className="navbar navbar-light bg-light">
              <div className="container-fluid">
                <a className="navbar-brand" href="#">shaderDrop</a>
                <status-indicator intermediary></status-indicator>
              </div>
            </nav>
          </div>
        </div>
        <div className="max-width"> <div>
          <div className="client">
            <IDDisplay id={this.props.id}/>
            <StateDisplay className="progressDiv" transferState={this.props.transferState} percentDone={this.props.transferPercent}/>
            <div className="center"><FileDropDisplay file={this.props.fileInfo} onFileDrop={this.props.onFileDrop}/></div>
          </div>
        </div> </div>
      </div>
    );
  }
}