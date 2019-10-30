'use strict';
import {BinMsgType} from './transport';
import WebRTCTransport from './rtctransport';

import {ReadableStream, WritableStream, TransformStream} from './wsfill';

/* Web-Browser based Streams */

export function createWritableStream(transport: WebRTCTransport) : WritableStream {
  let stream = new WritableStream<Uint8Array>({
    start(controller) {
    },
    write(chunk: Uint8Array, controller) {
      // fragment chunk
      const fragSize = 16384; // 16KiB (most common RTCDataChannel Message Maximum is 16KiB)
      let currentPromise = transport.bufferLow();
      
      let bytePos = 0;
      while (bytePos < chunk.length) {
        let sendBytes = Math.min(fragSize, chunk.length - bytePos);
        let fragChunk = chunk.subarray(bytePos, bytePos+sendBytes);
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

export function nullWritable() : WritableStream {
  let stream = new WritableStream<Uint8Array>({
    start(controller) {
    },
    write(chunk: Uint8Array, controller) {
      //console.log("chunk sent to null");
    },
  }, new ByteLengthQueuingStrategy({ highWaterMark: 16384 })); // 16KiB queue
  return stream;
}

export function createReadableStream(transport: WebRTCTransport) : ReadableStream {
  let stream = new ReadableStream({
    start(controller) {
      transport.binaryHandler = (data: BinMsgType) => {
        // data comes in as a array buffer & everything is expecting a Uint8Array
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

// copied from Blob.js
export function fromBlob(file) {
  var position = 0
  var blob = file

  return new ReadableStream({
    pull: function (controller) {
      var chunk = blob.slice(position, position + 524288)

      return chunk.arrayBuffer().then(function (buffer) {
        position += buffer.byteLength
        var uint8array = new Uint8Array(buffer)
        controller.enqueue(uint8array)

        if (position == blob.size)
          controller.close()
      })
    }
  })
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
