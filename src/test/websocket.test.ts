import 'mocha';
import { expect } from 'chai';
import WebSocket from "ws";

import {startup} from '../server';
import WebSocketTransport from '../transport/wstransport';

describe('websocket transport test', () => {
  let server;
  let client1;
  let client2;
  
  describe('server', () => {
    it('should startup', () => {
      server = startup();
    });
  });
  
  describe('client', () => {
    it('should connect', () => {
      client1 = new WebSocketTransport();
      client2 = new WebSocketTransport();
      let c1prom = client1.connect("ws://0.0.0.0:8081");
      let c2prom = client2.connect("ws://0.0.0.0:8081");
      return Promise.all([c1prom, c2prom]);
    });
    it('should get id', () => {
      return Promise.all([
        client1.id.get(),
        client2.id.get(),
      ]);
    });
    
    it('should pass messages', async () => {
      let client1transport = client1.transport(client2.id.value); // client 1->2
      let client2transport = client2.transport(client1.id.value); // client 2->1
      
      let testMsg = {
        msgType: "test",
        string: "this is a test message",
      };
      client1transport.sendJSON(testMsg);
      let msg2 = await client2transport.next("test");
      expect(msg2).to.eql(testMsg);
      
      client2transport.sendJSON(testMsg);
      let msg1 = await client1transport.next("test");
      expect(msg1).to.eql(testMsg);
    }).timeout(1000);
    
    it('should disconnect gracefully', (done) => {
      client1.disconnect().then(() => {
        return client2.disconnect();
      }).then(() => {
        server.close(done);
      });
    }).timeout(1000);
  });
});
