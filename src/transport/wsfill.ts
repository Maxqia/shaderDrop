'use strict';
var streams = require("web-streams-polyfill/ponyfill");
var StreamSaver = require('streamsaver');

let fReadable: typeof ReadableStream;
let fWritable: typeof WritableStream;
let fTransform: typeof TransformStream;

if(true || typeof WritableStream === "undefined") {
  fReadable = streams.ReadableStream;
  window.ReadableStream = streams.ReadableStream;
  fWritable = streams.WritableStream;
} else {
  fReadable = ReadableStream;
  fWritable = WritableStream;
}

if(true || typeof TransformStream === "undefined") {
  fTransform = streams.TransformStream;
} else {
  fTransform = TransformStream;
}

StreamSaver.WritableStream = fWritable;
StreamSaver.TransformStream = fTransform;

export { 
  fReadable as ReadableStream,
  fWritable as WritableStream,
  fTransform as TransformStream,
  StreamSaver,
};


