
/* Web-Browser based Streams */

export function createWritableStream(transport) {
  let stream = new WritableStream({
    start(controller) {
    },
    write(chunk, controller) {
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
      }
      return currentPromise;
    },
    close() {
      transport.close();
    },
  }, new ByteLengthQueuingStrategy({ highWaterMark: 16384 })); // 16KiB queue
  return stream;
}

export function createReadableStream(transport) {
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
