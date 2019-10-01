'use strict';
var nacl = require('tweetnacl');

// this file stores the various states of clients & the information they have
var clientListSocket = [];
var clientListID = [];

class Client {
  constructor(socket) {
    socket = socket;
    randomBytes = nacl.randomBytes(nacl.sign.signatureLength);
    verfied = false;
    publicKey = null;
    stringId = getRandomID();
  }
  
  // returns true if verification passed
  verify(publicKey, signedBytes) {
    this.publicKey = publicKey;
    var verifyBytes = nacl.sign.open(nacl.util.decodeBase64(bytesSigned),  nacl.util.decodeBase64(publicKey));
    this.verified = !nacl.verify(this.randomBytes, verifyBytes);
    delete this.randomBytes;
    return verified;
  }
}

// returns client reference
export function newClient(socket) {
  var client = new Client(socket);
  clientListSocket[socket] = client;
  clientListID[client.stringID] = client;
  return client;
}

export function deleteClient(socket) {

}

export function getBySocket(socket) {
  return clientListSocket[socket];
}

export function getByID(stringID) {
  return clientListID[stringID];
}

export function getByPublicKey(publicKey) {

}

var number = 0;
function getRandomID() {
  return number++.toString();
}
