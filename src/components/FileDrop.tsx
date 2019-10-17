import React, { DragEvent } from 'react';
import classNames from 'classnames';

import {FileInfo} from "../TestObject";
import * as WebStr from "../transport/webstr.js";

export type FileDropFunc = (fileInfo: FileInfo, readableStream: ReadableStream) => void;
interface FileDropProps {
  className: string;
  onFileDrop: FileDropFunc;
}

interface FileDropState {
  text: string;
}

// calls onFileDrop with a SyntheticFile object containing a stream
export class FileDrop extends React.Component<FileDropProps, FileDropState> {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
    };
    
    this.handleEvent = this.handleEvent.bind(this);
    this.handleSubmitText = this.handleSubmitText.bind(this);
    this.onDrop = this.onDrop.bind(this);
  }
  
  handleEvent(event) {
    this.setState({text: event.target.value});
  }
  
  handleSubmitText(event) {
    event.preventDefault();
    var textBlob = new Blob([this.state.text], {type: "text/plain"});
    
    var file = {
      name: "paste.txt",
      size: textBlob.size,
    };
    this.props.onFileDrop(file, WebStr.fromBlob(textBlob));
    
    this.setState({text: ""});
  }
  
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  onDrop(event: DragEvent) {
    this.preventDefaults(event);
    console.log(event);
    
    console.log(event.dataTransfer);
    
    let fileList = [];
    
    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if( event.dataTransfer.items[i].kind === "file" ) {
          let file = event.dataTransfer.items[i].getAsFile();
          fileList.push(file);
        }
      }
    } else {
      fileList.push(event.dataTransfer.files);
    }
    console.log(fileList);
    
    if (fileList.length >= 1) {
      if (fileList.length > 1) console.error("more than one file not supported!");
      this.dropFile(fileList[0]);
    }
  }
  
  dropFile(file: File) {
    let fileInfo = {
      name: file.name,
      size: file.size,
    }
    let readableStream = WebStr.fromBlob(file);
    this.props.onFileDrop(fileInfo, readableStream);
  }
  
  render() {
    return (
      <div className={classNames("fileDrop", this.props.className)}
          onDragEnter={this.preventDefaults}
          onDragOver={this.preventDefaults}
          onDragLeave={this.preventDefaults}
          onDrop={this.onDrop}
      >
        <div>Drop File </div>
        <div id="drop">
          <form>
            <input type="file" id="fileElem"/>
            <input type="button" value="Attach File"/>
          </form>
        </div>
        <div>(or paste text!)</div>
        <form onSubmit={this.handleSubmitText}>
          <textarea value={this.state.text} onChange={this.handleEvent}></textarea>
          <button>Submit</button>
        </form>
      </div>
    );
  }
}
