import LittlePubSub from '@vandeurenglenn/little-pubsub';
import Api from './api.js';
import ClientConnection from './connection.js'

if (!globalThis.PubSub) globalThis.PubSub = LittlePubSub
if (!globalThis.pubsub) globalThis.pubsub = new LittlePubSub(false)

declare type socketRequestMessage = {
  data: ArrayBuffer | Uint8Array
}

interface socketRequestClientInterface {
  api: Api;
  constructor(url: string, protocol?: string, options?: { retry: true, timeout: 10_000, times: 10 }): Promise<ClientConnection>
  onmessage(message: socketRequestMessage): void
}

class SocketRequestClient implements socketRequestClientInterface {
  api: Api;
  clientConnection: ClientConnection;
  #tries: number = 0;
  #retry: boolean = false;
  #timeout: EpochTimeStamp = 10_000;
  #times: number = 10;
  #options;
  #protocol: string;
  #url: string;

  ['constructor'](url: string, protocol?: string, options?: { retry: boolean; timeout: number; times: number; }): Promise<ClientConnection> {
    let { retry, timeout, times } = options;
    if (retry !== undefined) this.#retry = retry
    if (timeout !== undefined) this.#timeout = timeout  
    if (times !== undefined) this.#times = times

    this.#url = url
    this.#protocol = protocol

    this.#options = options
    this.api = new Api(globalThis.pubsub)
  
    return this.init()
  }


  init(): Promise<ClientConnection> {
    return new Promise(async (resolve, reject) => {
      const init = async () => {
        if (!globalThis.WebSocket) globalThis.WebSocket = (await import('websocket')).w3cwebsocket
        
        const client = new WebSocket(this.#url, this.#protocol);
  
        client.onmessage = this.onmessage;
        client.onerror = this.onerror;
        
        client.onopen = () => {
          this.#tries = 0;
          resolve(new ClientConnection(client, this.api))
        };
        client.onclose = message => {
          this.#tries++
          if (!this.#retry) return reject(this.#options)
          if (this.#tries > this.#times) {
            console.log(`${this.#options.protocol} Client Closed`);
            console.error(`could not connect to - ${this.#url}/`)
            return resolve(new ClientConnection(client, this.api))
          }
          if (message.code === 1006) {
            console.log(`Retrying in ${this.#timeout} ms`);
            setTimeout(() => {
              return init();
            }, this.#timeout);
          }
        };
      }
      return init();
    });
  
}


  onerror = error => {
    if (globalThis.pubsub.subscribers['error']) {
      globalThis.pubsub.publish('error', error);
    } else {
      console.error(error);
    }
  }

  onmessage(message) {
    const {value, url, status, id} = JSON.parse(message.data.toString());
    const publisher = id ? id : url;
    if (status === 200) {
      globalThis.pubsub.publish(publisher, value);
    } else {
      globalThis.pubsub.publish(publisher, {error: value});
    }
  }
}
export { SocketRequestClient as default }
