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
  
  /**
   * @param {string} type
   * @param {string} name
   * @param {object} params
   */
  const request = (client, request) => {
    return new Promise(async (resolve, reject) => {
      request.id = Math.random().toString(36).slice(-12);
      const handler = result => {
        if (result && result.error) return reject(result.error)
        resolve({result, id: request.id, handler})
      }
      subscribe(request.id, handler);
      // catch connection error
      try {
        await send(client, request);
      } catch (e) {
        reject(e)
      }
    });
  }
  
  const send = (client, request) => {
    return client.send(JSON.stringify(request))
  }

  const pubsub = client => {
    return {
      publish: (topic = 'pubsub', value) => {
        publish(topic, value)
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
        const { result, id, handler } = await request(client, {url: 'uptime'})        
        unsubscribe(id, handler);
        return result
      },
      ping: async () => {
        const now = new Date().getTime()
        const { result, id, handler } = await request(client, {url: 'ping'})
        unsubscribe(id, handler);
        return (Number(result) - now)
      }
    }
  }
  
  const peernet = (client) => {
    return {
      join: async (params) => {
        params.join = true;
        const requested = { url: 'peernet', params }
        const { result, id, handler } = await request(client, requested)        
        unsubscribe(id, handler);
        return result
      },
      leave: async (params) => {
        params.join = false;
        const requested = { url: 'peernet', params }
        const { result, id, handler } = await request(client, requested)        
        unsubscribe(id, handler);
        return result
      }
    }
  }
  
  return { send, request, pubsub, server, subscribe, unsubscribe, publish, peernet }
}