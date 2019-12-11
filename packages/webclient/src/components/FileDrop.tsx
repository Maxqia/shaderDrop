import React, { DragEvent } from 'react';
import classNames from 'classnames';

import {FileInfo} from "@shaderdrop/transport/lib/types";
import * as WebStr from "@shaderdrop/transport/lib/webstr";

export type FileDropFunc = (fileInfo: FileInfo, readableStream: ReadableStream) => void;
interface FileDropProps {
  className: string;
  onFileDrop: FileDropFunc;
}

interface FileDropState {
  text: string;
  hover: boolean;
}

// calls onFileDrop with a SyntheticFile object containing a stream
export class FileDrop extends React.Component<FileDropProps, FileDropState> {
  constructor(props) {
    super(props);
    this.state = {
      text: "",
      hover: false,
    };
    
    this.handleEvent = this.handleEvent.bind(this);
    this.handleSubmitText = this.handleSubmitText.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onFileChange = this.onFileChange.bind(this);
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
  
  onDrop(e) {
    let event: DragEvent = (e as unknown) as DragEvent;
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
  
  dropChildren:number = 0;
  onDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropChildren++;
    console.log(this.dropChildren);
    if (this.dropChildren > 0) {
      this.setState({hover: true});
    }
  }
  
  onDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropChildren--;
    console.log(this.dropChildren);
    if (this.dropChildren <= 0 ) {
      this.setState({hover: false});
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
  
  onFileChange(event) {
    console.log(event);
    let files = event.target.files;
    if (files.length == 1) {
      this.dropFile(files[0]);
    } else {
      console.error("error: recieved change event with " + files.length + " files!");
    }
  }
  
  componentDidMount() {
    // hacky hack
    let allChildren = document.querySelectorAll("#drop, #drop *");
    for(let child of allChildren) {
      child.addEventListener("drop", this.onDrop);
      child.addEventListener("dragenter",this.onDragEnter);
      child.addEventListener("dragover", this.preventDefaults);
      child.addEventListener("dragleave", this.onDragLeave);
    }
  }
  
  render() {
    return (
      <div className={classNames("fileDrop", 
          this.state.hover ? "hover" : null,
          this.props.className)}
          id="drop"
      >
        <div className="fileBorder">
          <div className="attachContainer">
            <div className="">Drop File</div>
            <div className="">or</div>
            <div className="" id="drop">
              <form>
                <input type="file" id="fileElem" onChange={this.onFileChange}/>
                <label htmlFor="fileElem" id="fileLabel">Attach File</label>
              </form>
            </div>
          </div>
          <div className="textContainer">
            <div>(or paste text!)</div>
            <form onSubmit={this.handleSubmitText}>
              <textarea value={this.state.text} onChange={this.handleEvent}></textarea>
              <button>Submit</button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
