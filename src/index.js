import PubSub from 'little-pubsub';
import clientApi from './api.js';

const socketRequestClient = (url, protocols = 'echo-protocol', options = { retry: false, pubsub: false }) => {
  let { pubsub, retry } = options;
  if (!pubsub) pubsub = new PubSub();
  
  const api = clientApi(pubsub)
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
      pubsub.publish(publisher, {error: value});
    }

  }  

  const clientConnection = client => {
    return {
      client,
      request: req => api.request(client, req),
      send: req => api.send(client, req),
      on: api.on,
      pubsub: api.pubsub(client),
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
      const client = new ws(url, protocols);

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
          console.log(`${protocols} Client Closed`);
          console.error(`could not connect to - ${url}/`)
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
