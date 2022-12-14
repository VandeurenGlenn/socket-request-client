export default _pubsub => {

  const subscribe = (topic, cb) => {
    _pubsub.subscribe(topic, cb);
  }

  const unsubscribe = (topic, cb) => {
    _pubsub.unsubscribe(topic, cb);
  }

  const publish = (topic, value) => {
    _pubsub.publish(topic, value);
  }

  const connectionState = (state) => {
    switch (state) {
      case 0:
        return 'connecting'
        break;
      case 1:
        return 'open'
        break;
      case 2:
        return 'closing'
        break;
      case 3:
        return 'closed'
        break;
    }
  }
  /**
   * @param {string} type
   * @param {string} name
   * @param {object} params
   */
  const request = (client, request) => {
    return new Promise((resolve, reject) => {

      const state = connectionState(client.readyState)
      if (state !== 'open') return reject(`coudn't send request to ${client.id}, no open connection found.`)

      request.id = Math.random().toString(36).slice(-12);
      const handler = result => {
        if (result && result.error) return reject(result.error)
        resolve({result, id: request.id, handler})
        unsubscribe(request.id, handler);
      }
      subscribe(request.id, handler);
      send(client, request);
    });
  }

  const send = async (client, request) => {
    return client.send(JSON.stringify(request))
  }

  const pubsub = client => {
    return {
      publish: (topic = 'pubsub', value) => {
        return send(client, {url: 'pubsub', params: { topic, value }})
      },
      subscribe: (topic = 'pubsub', cb) => {
        subscribe(topic, cb);
        return send(client, {url: 'pubsub', params: { topic, subscribe: true }})
      },
      unsubscribe: (topic = 'pubsub', cb) => {
        unsubscribe(topic, cb)
        return send(client, {url: 'pubsub', params: { topic, unsubscribe: true }})
      },
      subscribers: _pubsub.subscribers
    }
  }

  const server = (client) => {
    return {
      uptime: async () => {
        try {
          const { result, id, handler } = await request(client, {url: 'uptime'})
          unsubscribe(id, handler);
          return result
        } catch (e) {
          throw e
        }
      },
      ping: async () => {
        try {
          const now = new Date().getTime()
          const { result, id, handler } = await request(client, {url: 'ping'})
          unsubscribe(id, handler);
          return (Number(result) - now)
        } catch (e) {
          throw e
        }
      }
    }
  }

  const peernet = (client) => {
    return {
      join: async (params) => {
        try {
          params.join = true;
          const requested = { url: 'peernet', params }
          const { result, id, handler } = await request(client, requested)
          unsubscribe(id, handler);
          return result
        } catch (e) {
          throw e
        }
      },
      leave: async (params) => {
        try {
          params.join = false;
          const requested = { url: 'peernet', params }
          const { result, id, handler } = await request(client, requested)
          unsubscribe(id, handler);
          return result
        } catch (e) {
          throw e
        }
      }
    }
  }

  return { send, request, pubsub, server, subscribe, unsubscribe, publish, peernet, connectionState }
}
