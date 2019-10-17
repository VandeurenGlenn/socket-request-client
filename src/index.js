import PubSub from '../../little-pubsub/src/index.js';

const socketRequestClient = options => {
  let { port, protocol, pubsub, address, wss, retry } = options;
  if (!port) port = 6000;
  if (!protocol) protocol = 'echo-protocol';
  if (!pubsub) pubsub = new PubSub();
  if (!address) address = 'localhost';
  let tries = 0;

  const onerror = error => {
    if (pubsub.subscribers['error']) {
      pubsub.publish('error', error);
    } else {
      console.error(error);
    }
  }

  const onmessage = message => {
    const {value, url, status, id} = JSON.parse(message.data.toString());
    const publisher = id ? id : url;
    if (status === 200) {
      pubsub.publish(publisher, value);
    } else {
      value = {error: value};
      pubsub.publish(publisher, value);
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
      request.id = Math.random().toString(36).slice(-12);
      on(request.id, result => {
        if (result && result.error) return reject(result.error)
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
      on,
      close: exit => {
        client.onclose = message => {
          if (exit) process.exit()
        }
        client.close();
      }
    }
  }
  
  return new Promise((resolve, reject) => {
    const init = () => {
      let ws;
      if (typeof process === 'object') {
        ws = require('websocket').w3cwebsocket;
      } else {
        ws = WebSocket;
      }
      const client = new ws(`${wss ? 'wss' : 'ws'}://${address}:${port}/`, protocol);

      client.onmessage = onmessage;
      client.onerror = onerror;
      client.onopen = () => {
        tries = 0;
        resolve(clientConnection(client))
      };
      client.onclose = message => {
        tries++
        if (!retry) return reject(options)
        if (tries > 5) {
          console.log(`${protocol} Client Closed`);
          console.error(`could not connect to - ${wss ? 'wss' : 'ws'}://${address}:${port}/`)
          return resolve(clientConnection(client))
        }
        if (message.code === 1006) {
          console.log('Retrying in 10 seconds');
          setTimeout(() => {
            return init();
          }, retry);
        }
      };
    }
    return init();
  });
}
export default socketRequestClient;
