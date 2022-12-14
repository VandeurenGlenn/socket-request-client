import LittlePubSub from '@vandeurenglenn/little-pubsub';
import clientApi from './api.js';

if (!globalThis.PubSub) globalThis.PubSub = LittlePubSub
if (!globalThis.pubsub) globalThis.pubsub = new LittlePubSub({verbose: false})

const socketRequestClient = (url, protocols = 'echo-protocol', options = { retry: true, timeout: 10_000, times: 10 }) => {
  let { retry, timeout, times } = options;
  if (retry === undefined) retry = true
  if (timeout === undefined) timeout = 10_000  
  if (times === undefined) times = 10

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
    const startTime = new Date().getTime()
    return {
      client,
      request: async req => {
        const { result, id, handler } = await api.request(client, req)
        pubsub.unsubscribe(id, handler);
        return result
      },
      send: req => api.send(client, req),
      subscribe: api.subscribe,
      unsubscribe: api.unsubscribe,
      subscribers: api.subscribers,
      publish: api.publish,
      pubsub: api.pubsub(client),
      uptime: () => {
        const now = new Date().getTime()
        return (now - startTime)
      },
      peernet: api.peernet(client),
      server: api.server(client),
      connectionState: () => api.connectionState(client.readyState),
      close: exit => {
        // client.onclose = message => {
        //   if (exit) process.exit()
        // }
        client.close();
      }
    }
  }

  return new Promise((resolve, reject) => {
    const init = () => {
      let ws;
      if (typeof process === 'object' && !globalThis.WebSocket) {
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
        if (tries > times) {
          console.log(`${protocols} Client Closed`);
          console.error(`could not connect to - ${url}/`)
          return resolve(clientConnection(client))
        }
        if (message.code === 1006) {
          console.log(`Retrying in ${timeout} ms`);
          setTimeout(() => {
            return init();
          }, timeout);
        }
      };
    }
    return init();
  });
}
export { socketRequestClient as default }
