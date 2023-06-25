import Api from './api.js'
import {SocketRequest} from './api.js'

class ClientConnection {
  client: WebSocket
  api: Api
  #startTime

  constructor(client: WebSocket, api: Api) {
    this.#startTime = new Date().getTime()
    this.client = client
    this.api = api
  }

  request = async (req: SocketRequest) => {
    const { result, id, handler } = await this.api.request(this.client, req)
    globalThis.pubsub.unsubscribe(id, handler);
    return result
  }

  send = req => this.api.send(this.client, req)
  
  get subscribe() {
    return this.api.subscribe
  }
  get unsubscribe() {
    return this.api.unsubscribe
  } 
  get subscribers() {
    return this.api.subscribers
  } 
  get publish() {
    return this.api.publish
  } 
  get pubsub() {
    return this.api.pubsub(this.client)
  } 

  uptime = () => {
    const now = new Date().getTime()
    return (now - this.#startTime)
  }

  get peernet() {
    return this.api.peernet(this.client)
  }
  get server() {
    return this.api.server(this.client)
  }
  connectionState = () => this.api.connectionState(this.client.readyState)

  close = exit => {
    // client.onclose = message => {
    //   if (exit) process.exit()
    // }
    this.client.close();
  }

  
}

export { ClientConnection as default }