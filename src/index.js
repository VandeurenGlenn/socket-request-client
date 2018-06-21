import PubSub from '../../little-pubsub/src/index.js';

const socketRequestClient = (port = 6000, protocol = 'echo-protocol', pubsub) => {
  if (!pubsub) pubsub = new PubSub();
  const onerror = error => {
    pubsub.publish('error', error);
  }

  const onmessage = message => {
    const {value, url, status} = JSON.parse(message.data.toString());

    if (status === 200) {
      pubsub.publish(url, value);
    } else {
      onerror(`Failed requesting ${type} @onmessage`);
    }

  }

  const send = (client, request) => {
    client.send(JSON.stringify(request))
  }

  const on = (url, cb) => {
    pubsub.subscribe(url, cb);
  }

  /**
   * @param {string} type
   * @param {string} name
   * @param {object} params
   */
  const request = (client, request) => {
    return new Promise((resolve, reject) => {
      on(request.url, result => {
        resolve(result)
      });
      send(client, request);
    });
  }

  const clientConnection = client => {
    return {
      client,
      request: req => request(client, req),
      send: req => send(client, req),
      close: exit => {
        client.onclose = message => {
          if (exit) process.exit()
        }
        client.close();
      }
    }
  }

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
        // TODO: fail after 10 times
        if (message.code === 1006) {
          console.log('Retrying in 3 seconds');
          setTimeout(() => {
            return init();
          }, 3000);
        }
      };
    }
    return init();
  });
}
export default socketRequestClient;
