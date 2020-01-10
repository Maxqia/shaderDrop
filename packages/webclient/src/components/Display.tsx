import React from 'react';
import classNames from 'classnames';
import bytes from 'bytes';
import QRCode from 'qrcode.react';

import { FileDrop, FileDropFunc } from "./FileDrop";
import { FileInfo } from "@shaderdrop/transport/lib/types";

interface FileDisplayProps {
  className?: string;
  file: FileInfo;
}

export class FileDisplay extends React.Component<FileDisplayProps, {}> {
  render() {
    return (
      <div className={classNames(this.props.className)}>
        <div className="row">
          <div className="col">
            {this.props.file.name}
          </div>
          <div className="col text-right">
            {bytes(this.props.file.size)}
          </div>
        </div>
      </div>
    );
  }
}

interface StateDisplayProps {
  className?: string;
  percentDone: number;
  transferState: string;
}

export const StateDisplay: React.FC<StateDisplayProps> = (props) => {
  return (
    <div className={classNames(props.className)}>
      <div>
        <div className="progress">
          <div className="progress-bar" role="progressbar" style={{ width: props.percentDone+'%'}} aria-valuenow={props.percentDone} aria-valuemin={0} aria-valuemax={100}></div>
        </div>
      </div>
      <div className="text-center">
        {props.transferState /* transfer status */}
      </div>
    </div>
  );
}

interface FileDropDisplayProps {
  className?: string;
  file: FileInfo;
  onFileDrop: FileDropFunc;
}

export const FileDropDisplay: React.FC<FileDropDisplayProps> = (props) => {
  if (props.file != null) {
    return <FileDisplay file={props.file} className={props.className}/>;
  } else {
    return <FileDrop onFileDrop={props.onFileDrop} className={props.className}/>
  }
}

interface IDDisplayProps {
  className?: string;
  id: string;
}

export const IDDisplay: React.FC<IDDisplayProps> = (props) => {
  if (props.id != null) {
    return (
      <div className={props.className}>
        <div className="qr"><QRCode size={116} value={props.id}/></div>
        <div className="id text-center">{props.id}</div>
      </div>
    );
  } else {
    return (
      <div className={props.className}>
        <div className="qr"><img src="qrmark.png"/></div>
        <div className="id text-center">unknown id</div>
      </div>
    );
  }
}
