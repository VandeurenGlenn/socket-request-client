/* socket-request-client version 0.3.0 */
'use strict';

const ENVIRONMENT = {version: '0.3.0', production: true};

class PubSub {
  constructor() {
    this.subscribers = {};
    this.values = [];
  }
  subscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    this.subscribers[event] = this.subscribers[event] || { handlers: []};
    this.subscribers[event].handlers.push(handler.bind(context));
  }
  unsubscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    const i = this.subscribers[event].handlers.indexOf(handler.bind(context));
    this.subscribers[event].handlers.splice(i);
  }
  publish(event, change) {
    this.subscribers[event].handlers.forEach(handler => {
      if (this.values[event] !== change)
        handler(change, this.values[event]);
        this.values[event] = change;
      });
  }
}

const socketRequestClient = (port = 6000, protocol = 'echo-protocol', pubsub) => {
  if (!pubsub) pubsub = new PubSub();
  const onerror = error => {
    pubsub.publish('error', error);
  };
  const onmessage = message => {
    const {value, url, status} = JSON.parse(message.data.toString());
    if (status === 200) {
      pubsub.publish(url, value);
    } else {
      onerror(`Failed requesting ${type} @onmessage`);
    }
  };
  const send = (client, request) => {
    client.send(JSON.stringify(request));
  };
  const on = (url, cb) => {
    pubsub.subscribe(url, cb);
  };
  const request = (client, request) => {
    return new Promise((resolve, reject) => {
      on(request.url, result => {
        resolve(result);
      });
      send(client, request);
    });
  };
  const clientConnection = client => {
    return {
      client,
      request: req => request(client, req),
      send: req => send(client, req),
      close: exit => {
        client.onclose = message => {
          if (exit) process.exit();
        };
        client.close();
      }
    }
  };
  return new Promise(resolve => {
    const init = () => {
      let ws;
      if (typeof process === 'object') {
        ws = require('websocket').w3cwebsocket;
      } else {
        ws = WebSocket;
      }
      const client = new ws(`ws://localhost:${port}/`, protocol);
      client.onmessage = onmessage;
      client.onerror = onerror;
      client.onopen = () => resolve(clientConnection(client));
      client.onclose = message => {
        console.log(`${protocol} Client Closed`);
        if (message.code === 1006) {
          console.log('Retrying in 3 seconds');
          setTimeout(() => {
            return init();
          }, 3000);
        }
      };
    };
    return init();
  });
};

module.exports = socketRequestClient;
