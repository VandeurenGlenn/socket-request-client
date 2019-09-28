import PubSub from '../../little-pubsub/src/index.js';

const socketRequestClient = options => {
  let { port, protocol, pubsub, address, wss} = options;
  if (!port) port = 6000;
  if (!protocol) protocol = 'echo-protocol';
  if (!pubsub) pubsub = new PubSub();
  if (!address) address = 'localhost';
  let tries = 0;

  const onerror = error => {
    if (pubsub.subscribers['error']) {
      pubsub.publish('error', error);
    } else {
      if (error.target.readyState !== 3) console.error(error);
    }
  }

  const onmessage = message => {
    const {value, url, status, id} = JSON.parse(message.data.toString());
    const publisher = id ? id : url;
    if (status === 200) {
      pubsub.publish(publisher, value);
    } else {
      // pubsub.publish(publisher, btoa(JSON.stringify(value)));
      onerror(`Failed requesting ${JSON.stringify(value)} @onmessage`);
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
  
  return new Promise(resolve => {
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
        console.log(`${protocol} Client Closed`);
        if (tries > 5) throw new Error(`404 - ${wss ? 'wss' : 'ws'}://${address}:${port}/`)
        if (message.code === 1006) {
          console.log('Retrying in 10 seconds');
          setTimeout(() => {
            return init();
          }, 10000);
        }
      };
    }
    return init();
  });
}
export default socketRequestClient;
