import WebRTCTransport from './rtctransport';

/* Web-Browser based Streams */

export function createWritableStream(transport: WebRTCTransport) : WritableStream {
  let stream = new WritableStream({
    start(controller) {
    },
    write(chunk: Uint8Array, controller) {
      // fragment chunk
      const fragSize = 16384; // 16KiB (most common RTCDataChannel Message Maximum is 16KiB)
      let currentPromise = transport.bufferLow();
      
      let bytePos = 0;
      while (bytePos < chunk.length) {
        let sendBytes = Math.min(fragSize, chunk.length - bytePos);
        let fragChunk = chunk.subarray(bytePos, bytePos+sendBytes); // TODO what type are we reciving???
        currentPromise = currentPromise.then(() => {
          transport.send(fragChunk);
          return transport.bufferLow();
        });
        bytePos += sendBytes;
      }
      return currentPromise;
    },
    close() {
      return transport.bufferEmpty().then(() => {
        transport.disconnect();
      });
    },
  }, new ByteLengthQueuingStrategy({ highWaterMark: 16384 })); // 16KiB queue
  return stream;
}

export function createReadableStream(transport: WebRTCTransport) : ReadableStream {
  let stream = new ReadableStream({
    start(controller) {
      transport.defaultHandler = (data) => {
        let uint8View = new Uint8Array(data);
        controller.enqueue(uint8View);
      };
      transport.close.register(() => {
        controller.close();
      });
    },
  }, new ByteLengthQueuingStrategy({ highWaterMark: 16384 })); // 16KiB queue
  return stream;
}

export function fromBlob(file) {
  return file.stream(); // TODO this isn't well supported, probably need to polyfill it
}

export type ProgCallback = (percentDone: number, bps: number) => null;
export class CountingStream extends TransformStream {
  startingTime: Date;
  bytesTotal: number;
  bytesTransfered: number;
  intervalID: any;
  updateProgress: ProgCallback;
  
  constructor(size: number, updateProgress: ProgCallback) {
    super({
      transform: (chunk, controller) => {
        this.bytesTransfered += chunk.length;
        controller.enqueue(chunk);
      },
      flush: (controller) => {
        this.update();
        clearInterval(this.intervalID);
      }
    });
    this.startingTime = new Date();
    this.bytesTotal = size;
    this.bytesTransfered = 0;
    this.intervalID = setInterval(this.update.bind(this), 100);
    this.updateProgress = updateProgress;
    this.update();
  }
  
  update(): void {
    let currentTime = new Date();
    let diffTime = currentTime.getTime() - this.startingTime.getTime(); // in miliseconds
    let bps = this.bytesTransfered / (diffTime/1000);
    let percentDone = this.bytesTransfered / this.bytesTotal;
    this.updateProgress(percentDone, bps);
  }
}
