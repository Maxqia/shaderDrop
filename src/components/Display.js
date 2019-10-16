import React, {Component} from 'react';
import classNames from 'classnames';
import bytes from 'bytes';
import QRCode from 'qrcode.react';

import { FileDrop } from "./FileDrop.js"

export class FileDisplay extends Component {
  render() {
    return (
      <div className={classNames(props.className)}>
        <div>
          <div>
            {this.props.file.name}
          </div>
          <div>
            {bytes(this.props.file.size)}
          </div>
        </div>
      </div>
    );
  }
}

export function StateDisplay(props) {
  return (
    <div className={classNames(props.className)}>
      <div>
        <div className="progress">
          <div className="progress-bar" role="progressbar" style={{ width: props.percentDone+'%'}} aria-valuenow={props.percentDone} aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
      <div className="text-center">
        {props.transferState /* transfer status */}
      </div>
    </div>
  );
}

export function FileDropDisplay(props) {
  if (props.file != null) {
    return <FileDisplay file={props.fileInfo} className={props.className}/>;
  } else {
    return <FileDrop onFileDrop={props.onFileDrop} className={props.className}/>
  }
}

export function IDDisplay(props) {
  if (props.id != null) {
    return (
      <div className={props.className}>
        <div className="qr"><QRCode value={props.id}/></div>
        <div className="id text-center">{props.id}</div>
      </div>
    );
  } else {
    return null;
  }
}
