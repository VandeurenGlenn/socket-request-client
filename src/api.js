export default _pubsub => {
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
  
  const send = (client, request) => {
    client.send(JSON.stringify(request))
  }

  const pubsub = client => {
    return {
      publish: (topic = 'pubsub', value) => {
        _pubsub.publish(topic, value)
        send(client, {url: 'pubsub', params: { topic, value }})
      },
      subscribe: (topic = 'pubsub', cb) => {
        _pubsub.subscribe(topic, cb);
        send(client, {url: 'pubsub', params: { topic, subscribe: true }})
      },
      unsubscribe: (topic = 'pubsub', cb) => {
        _pubsub.unsubscribe(topic, cb)
        
        send(client, {url: 'pubsub', params: { topic, unsubscribe: true }})
      },
      subscribers: _pubsub.subscribers
    }
  }
  const on = (url, cb) => {
    pubsub.subscribe(url, cb);
  }
  
  return {on, send, request, pubsub}
}