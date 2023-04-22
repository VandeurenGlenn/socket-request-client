import Api from './api.js'

class ClientConnection {

  constructor(client: WebSocket, api: Api) {
    const startTime = new Date().getTime()
    return {
      client,
      request: async req => {
        const { result, id, handler } = await api.request(client, req)
        globalThis.pubsub.unsubscribe(id, handler);
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
}

export { ClientConnection as default }