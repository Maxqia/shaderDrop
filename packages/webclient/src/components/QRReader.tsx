import React from 'react';
import Instascan from '@eventstag/instascan';
import Back from "./Back";


interface QRReaderProps {
  className?: string;
  toolbar?: React.ReactNode;
  onError: (error: any) => void;
  onScan: (data: string) => void;
}

export class QRReader extends React.Component<QRReaderProps,{}> {
  scanner: Instascan.Scanner = null;
  facingMode: string = "environment";
  frontFacing: boolean = false;
  
  cameras: any;
  cameraIndex: number = null;
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <div className="cameraflex fullscreen">
        <video id="preview" className={this.props.className}></video>
        <div className="bottomBar">
          <div className="actionDiv">
            <div><Back>Back</Back></div>
            { this.props.toolbar }
            <div onClick={this.flip.bind(this)}><img className="flip" src="iconfinder_rotate_on_1372387.svg"/></div>
          </div>
          { this.props.children }
        </div>
      </div>
    );
  }
  
  flip() {
    if (this.cameras.length > 0) {
        this.scanner.stop();
        this.cameraIndex = (this.cameraIndex+1) % this.cameras.length;
        localStorage.setItem("cameraIndex", this.cameraIndex.toString());
        this.scanner.start(this.cameras[this.cameraIndex]);
    } else {
        this.props.onError('No cameras found.');
    }
  }
  
  componentDidMount() {
    this.scanner = new Instascan.Scanner({
      video: document.getElementById('preview'),
      mirror: false,
    });
    this.scanner.addListener('scan', (data) => {
      console.log(data);
      this.props.onScan(data);
    });
    Instascan.Camera.getCameras().then((cameras) => {
      this.cameras = cameras;

      if (cameras.length > 0) {
        // null % (>=1) = 0
        this.cameraIndex = Number(localStorage.getItem("cameraIndex")) % cameras.length;
        this.scanner.start(this.cameras[this.cameraIndex]);
      } else {
        this.props.onError('No cameras found.');
      }
    }).catch((e) => {
      this.props.onError(e);
    });
  }
  
  componentWillUnmount() {
    this.scanner.stop();
  }
}
