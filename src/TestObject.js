'use strict';

// SyntheticFile object
var FakeFile = {
  name : "test.txt",
  size: 40,
  type: "text/plain",
  stringID: "a0e48eaa-e11b-4e33-96cf-87c8bc49bf11",
};

var FakeClient = {
  stringID: "897b4c7d-b7e1-4524-b048-35601c4381c8",
  publicKey: "5z9YGh06wj6UrLMVceSt8CBdiMCnpI9l8/VORwZFzXM=",
  verified: true,
  sending: true,
  file: FakeFile,
};

export {FakeFile, FakeClient};
