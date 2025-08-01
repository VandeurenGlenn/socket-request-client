import LittlePubSub from '@vandeurenglenn/little-pubsub'

declare type Response = {
  result: Uint8Array | ArrayBuffer
  id: string
  handler: Function
}

export declare type SocketRequest = {
  url: string
  id?: string
  params?: {}
}

class Api {
  _pubsub

  constructor(_pubsub: LittlePubSub) {
    this._pubsub = _pubsub
  }

  subscribe(topic, cb) {
    this._pubsub.subscribe(topic, cb)
  }

  unsubscribe(topic, cb) {
    this._pubsub.unsubscribe(topic, cb)
  }

  publish(topic, value) {
    this._pubsub.publish(topic, value)
  }

  subscribers() {
    this._pubsub.subscribers
  }

  connectionState(state) {
    switch (state) {
      case 0:
        return 'connecting'
      case 1:
        return 'open'
      case 2:
        return 'closing'
      case 3:
        return 'closed'
    }
  }
  /**
   * @param {string} type
   * @param {string} name
   * @param {object} params
   */
  request(client, request): Promise<{ result; id; handler }> {
    return new Promise((resolve, reject) => {
      const state = this.connectionState(client.readyState)
      if (state !== 'open')
        return reject(
          `coudn't send request to ${client.id}, no open connection found.`
        )

      request.id = Math.random().toString(36).slice(-12)
      const handler = (result) => {
        if (result && result.error) return reject(result.error)
        resolve({ result, id: request.id, handler })
        this.unsubscribe(request.id, handler)
      }
      this.subscribe(request.id, handler)
      this.send(client, request)
    })
  }

  async send(client, request) {
    return client.send(JSON.stringify(request))
  }

  pubsub(client) {
    return {
      publish: (topic = 'pubsub', value) => {
        return this.send(client, { url: 'pubsub', params: { topic, value } })
      },
      subscribe: (topic = 'pubsub', cb) => {
        this.subscribe(topic, cb)
        return this.send(client, {
          url: 'pubsub',
          params: { topic, subscribe: true }
        })
      },
      unsubscribe: (topic = 'pubsub', cb) => {
        this.unsubscribe(topic, cb)
        return this.send(client, {
          url: 'pubsub',
          params: { topic, unsubscribe: true }
        })
      },
      subscribers: this._pubsub.subscribers
    }
  }

  server(client) {
    return {
      uptime: async () => {
        try {
          const { result, id, handler } = await this.request(client, {
            url: 'uptime'
          })
          this.unsubscribe(id, handler)
          return result
        } catch (e) {
          throw e
        }
      },
      ping: async () => {
        try {
          const now = new Date().getTime()
          const { result, id, handler } = await this.request(client, {
            url: 'ping'
          })
          this.unsubscribe(id, handler)
          return Number(result) - now
        } catch (e) {
          throw e
        }
      }
    }
  }

  peernet(client) {
    return {
      join: async (params) => {
        try {
          params.join = true
          const requested = { url: 'peernet', params }
          const { result, id, handler } = await this.request(client, requested)
          this.unsubscribe(id, handler)
          return result
        } catch (e) {
          throw e
        }
      },
      leave: async (params) => {
        try {
          params.join = false
          const requested = { url: 'peernet', params }
          const { result, id, handler } = await this.request(client, requested)
          this.unsubscribe(id, handler)
          return result
        } catch (e) {
          throw e
        }
      },
      peers: async (params) => {
        try {
          params.peers = true
          const requested = { url: 'peernet', params }
          const { result, id, handler } = await this.request(client, requested)
          this.unsubscribe(id, handler)
          return result
        } catch (e) {
          throw e
        }
      }
    }
  }
}

export { Api as default }
