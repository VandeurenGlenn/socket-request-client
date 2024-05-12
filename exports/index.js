import LittlePubSub from '@vandeurenglenn/little-pubsub';

class Api {
    _pubsub;
    constructor(_pubsub) {
        this._pubsub = _pubsub;
    }
    subscribe(topic, cb) {
        this._pubsub.subscribe(topic, cb);
    }
    unsubscribe(topic, cb) {
        this._pubsub.unsubscribe(topic, cb);
    }
    publish(topic, value) {
        this._pubsub.publish(topic, value);
    }
    subscribers() {
        this._pubsub.subscribers;
    }
    connectionState(state) {
        switch (state) {
            case 0:
                return 'connecting';
            case 1:
                return 'open';
            case 2:
                return 'closing';
            case 3:
                return 'closed';
        }
    }
    /**
     * @param {string} type
     * @param {string} name
     * @param {object} params
     */
    request(client, request) {
        return new Promise((resolve, reject) => {
            const state = this.connectionState(client.readyState);
            if (state !== 'open')
                return reject(`coudn't send request to ${client.id}, no open connection found.`);
            request.id = Math.random().toString(36).slice(-12);
            const handler = result => {
                if (result && result.error)
                    return reject(result.error);
                resolve({ result, id: request.id, handler });
                this.unsubscribe(request.id, handler);
            };
            this.subscribe(request.id, handler);
            this.send(client, request);
        });
    }
    async send(client, request) {
        return client.send(JSON.stringify(request));
    }
    pubsub(client) {
        return {
            publish: (topic = 'pubsub', value) => {
                return this.send(client, { url: 'pubsub', params: { topic, value } });
            },
            subscribe: (topic = 'pubsub', cb) => {
                this.subscribe(topic, cb);
                return this.send(client, { url: 'pubsub', params: { topic, subscribe: true } });
            },
            unsubscribe: (topic = 'pubsub', cb) => {
                this.unsubscribe(topic, cb);
                return this.send(client, { url: 'pubsub', params: { topic, unsubscribe: true } });
            },
            subscribers: this._pubsub.subscribers
        };
    }
    server(client) {
        return {
            uptime: async () => {
                try {
                    const { result, id, handler } = await this.request(client, { url: 'uptime' });
                    this.unsubscribe(id, handler);
                    return result;
                }
                catch (e) {
                    throw e;
                }
            },
            ping: async () => {
                try {
                    const now = new Date().getTime();
                    const { result, id, handler } = await this.request(client, { url: 'ping' });
                    this.unsubscribe(id, handler);
                    return (Number(result) - now);
                }
                catch (e) {
                    throw e;
                }
            }
        };
    }
    peernet(client) {
        return {
            join: async (params) => {
                try {
                    params.join = true;
                    const requested = { url: 'peernet', params };
                    const { result, id, handler } = await this.request(client, requested);
                    this.unsubscribe(id, handler);
                    return result;
                }
                catch (e) {
                    throw e;
                }
            },
            leave: async (params) => {
                try {
                    params.join = false;
                    const requested = { url: 'peernet', params };
                    const { result, id, handler } = await this.request(client, requested);
                    this.unsubscribe(id, handler);
                    return result;
                }
                catch (e) {
                    throw e;
                }
            }
        };
    }
}

class ClientConnection {
    client;
    api;
    #startTime;
    constructor(client, api) {
        this.#startTime = new Date().getTime();
        this.client = client;
        this.api = api;
    }
    request = async (req) => {
        const { result, id, handler } = await this.api.request(this.client, req);
        globalThis.pubsub.unsubscribe(id, handler);
        return result;
    };
    send = (req) => this.api.send(this.client, req);
    get subscribe() {
        return this.api.subscribe;
    }
    get unsubscribe() {
        return this.api.unsubscribe;
    }
    get subscribers() {
        return this.api.subscribers;
    }
    get publish() {
        return this.api.publish;
    }
    get pubsub() {
        return this.api.pubsub(this.client);
    }
    uptime = () => {
        const now = new Date().getTime();
        return (now - this.#startTime);
    };
    get peernet() {
        return this.api.peernet(this.client);
    }
    get server() {
        return this.api.server(this.client);
    }
    connectionState = () => this.api.connectionState(this.client.readyState);
    close = exit => {
        // client.onclose = message => {
        //   if (exit) process.exit()
        // }
        this.client.close();
    };
}

if (!globalThis.PubSub)
    globalThis.PubSub = LittlePubSub;
if (!globalThis.pubsub)
    globalThis.pubsub = new LittlePubSub(false);
class SocketRequestClient {
    api;
    clientConnection;
    #tries = 0;
    #retry = false;
    #timeout = 10000;
    #times = 10;
    #options;
    #protocol;
    #url;
    #experimentalWebsocket = false;
    constructor(url, protocol, options) {
        let { retry, timeout, times, experimentalWebsocket } = options || {};
        if (retry !== undefined)
            this.#retry = retry;
        if (timeout !== undefined)
            this.#timeout = timeout;
        if (times !== undefined)
            this.#times = times;
        if (experimentalWebsocket !== undefined)
            this.#experimentalWebsocket;
        this.#url = url;
        this.#protocol = protocol;
        this.#options = options;
        this.api = new Api(globalThis.pubsub);
    }
    init() {
        return new Promise(async (resolve, reject) => {
            const init = async () => {
                // @ts-ignore
                if (!globalThis.WebSocket && !this.#experimentalWebsocket)
                    globalThis.WebSocket = (await import('websocket')).default.w3cwebsocket;
                const client = new WebSocket(this.#url, this.#protocol);
                if (this.#experimentalWebsocket) {
                    client.addEventListener('error', this.onerror);
                    client.addEventListener('message', this.onmessage);
                    client.addEventListener('open', () => {
                        this.#tries = 0;
                        resolve(new ClientConnection(client, this.api));
                    });
                    client.addEventListener('close', (client.onclose = (message) => {
                        this.#tries++;
                        if (!this.#retry)
                            return reject(this.#options);
                        if (this.#tries > this.#times) {
                            console.log(`${this.#options.protocol} Client Closed`);
                            console.error(`could not connect to - ${this.#url}/`);
                            return resolve(new ClientConnection(client, this.api));
                        }
                        if (message.code === 1006) {
                            console.log(`Retrying in ${this.#timeout} ms`);
                            setTimeout(() => {
                                return init();
                            }, this.#timeout);
                        }
                    }));
                }
                else {
                    client.onmessage = this.onmessage;
                    client.onerror = this.onerror;
                    client.onopen = () => {
                        this.#tries = 0;
                        resolve(new ClientConnection(client, this.api));
                    };
                    client.onclose = (message) => {
                        this.#tries++;
                        if (!this.#retry)
                            return reject(this.#options);
                        if (this.#tries > this.#times) {
                            console.log(`${this.#options.protocol} Client Closed`);
                            console.error(`could not connect to - ${this.#url}/`);
                            return resolve(new ClientConnection(client, this.api));
                        }
                        if (message.code === 1006) {
                            console.log(`Retrying in ${this.#timeout} ms`);
                            setTimeout(() => {
                                return init();
                            }, this.#timeout);
                        }
                    };
                }
            };
            return init();
        });
    }
    onerror = (error) => {
        if (globalThis.pubsub.subscribers['error']) {
            globalThis.pubsub.publish('error', error);
        }
        else {
            console.error(error);
        }
    };
    onmessage(message) {
        if (!message.data) {
            console.warn(`message ignored because it contained no data`);
            return;
        }
        const { value, url, status, id } = JSON.parse(message.data.toString());
        const publisher = id ? id : url;
        if (status === 200) {
            globalThis.pubsub.publish(publisher, value);
        }
        else {
            globalThis.pubsub.publish(publisher, { error: value });
        }
    }
}

export { SocketRequestClient };
