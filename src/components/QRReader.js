import React from 'react';
import Instascan from '@eventstag/instascan';

export class QRReader extends React.Component {
  constructor(props) {
    super(props);
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
      if (cameras.length > 0) {
        this.scanner.start(cameras[1]);
      } else {
        this.props.onError('No cameras found.');
      }
    }).catch(function (e) {
      this.props.onError(e);
    });
  }
  
  render() {
    return (<video id="preview" className={this.props.className}></video>);
  }
}
