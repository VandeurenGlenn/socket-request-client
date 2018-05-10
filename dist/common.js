/* socket-request-client version 0.1.0 */
'use strict';

const ENVIRONMENT = {version: '0.1.0', production: true};

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var PubSub = _interopDefault(require('PubSub'));
require('websocket');

const socketRequestClient = (port = 6000, protocol = 'echo-protocol', WebSocket) => {
  const pubsub = new PubSub();
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
    client.send(Buffer.from(JSON.stringify(request)));
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
      const client = new WebSocket(`ws://localhost:${port}/`, protocol);
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
