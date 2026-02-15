import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Api, ClientConnection, SocketRequestClient } from './exports/index.js'
import LittlePubSub from '@vandeurenglenn/little-pubsub'

// --- Api unit tests ---

describe('Api', () => {
  let pubsub
  let api

  beforeEach(() => {
    pubsub = new LittlePubSub(false)
    api = new Api(pubsub)
  })

  describe('connectionState', () => {
    it('returns "connecting" for state 0', () => {
      assert.equal(api.connectionState(0), 'connecting')
    })

    it('returns "open" for state 1', () => {
      assert.equal(api.connectionState(1), 'open')
    })

    it('returns "closing" for state 2', () => {
      assert.equal(api.connectionState(2), 'closing')
    })

    it('returns "closed" for state 3', () => {
      assert.equal(api.connectionState(3), 'closed')
    })

    it('returns undefined for unknown state', () => {
      assert.equal(api.connectionState(99), undefined)
    })
  })

  describe('subscribe / publish / unsubscribe', () => {
    it('receives published value after subscribing', (t, done) => {
      api.subscribe('test-topic', (value) => {
        assert.equal(value, 'hello')
        done()
      })
      api.publish('test-topic', 'hello')
    })

    it('does not receive value after unsubscribing', () => {
      let called = false
      const handler = () => {
        called = true
      }
      api.subscribe('topic', handler)
      api.unsubscribe('topic', handler)
      api.publish('topic', 'data')
      assert.equal(called, false)
    })
  })

  describe('send', () => {
    it('sends JSON-stringified request via client', async () => {
      let sent
      const fakeClient = {
        send: (data) => {
          sent = data
        }
      }
      await api.send(fakeClient, { url: 'test', params: { foo: 'bar' } })
      const parsed = JSON.parse(sent)
      assert.equal(parsed.url, 'test')
      assert.deepEqual(parsed.params, { foo: 'bar' })
    })
  })

  describe('request', () => {
    it('rejects when connection is not open', async () => {
      const fakeClient = { readyState: 3 }
      await assert.rejects(() => api.request(fakeClient, { url: 'test' }))
    })

    it('resolves with result when response is published', async () => {
      const fakeClient = {
        readyState: 1,
        send: (data) => {
          const { id } = JSON.parse(data)
          // simulate server response
          setTimeout(() => pubsub.publish(id, 'response-value'), 10)
        }
      }
      const { result } = await api.request(fakeClient, { url: 'test' })
      assert.equal(result, 'response-value')
    })

    it('rejects when response contains an error', async () => {
      const fakeClient = {
        readyState: 1,
        send: (data) => {
          const { id } = JSON.parse(data)
          setTimeout(
            () => pubsub.publish(id, { error: 'something went wrong' }),
            10
          )
        }
      }
      await assert.rejects(
        () => api.request(fakeClient, { url: 'test' }),
        (err) => {
          assert.equal(err, 'something went wrong')
          return true
        }
      )
    })
  })

  describe('pubsub proxy', () => {
    it('publish sends correct request', () => {
      let sent
      const fakeClient = {
        send: (data) => {
          sent = JSON.parse(data)
        }
      }
      const proxy = api.pubsub(fakeClient)
      proxy.publish('my-topic', 'my-value')
      assert.equal(sent.url, 'pubsub')
      assert.equal(sent.params.topic, 'my-topic')
      assert.equal(sent.params.value, 'my-value')
    })

    it('subscribe sends request and registers handler', () => {
      let sent
      const fakeClient = {
        send: (data) => {
          sent = JSON.parse(data)
        }
      }
      const proxy = api.pubsub(fakeClient)
      proxy.subscribe('my-topic', () => {})
      assert.equal(sent.url, 'pubsub')
      assert.equal(sent.params.topic, 'my-topic')
      assert.equal(sent.params.subscribe, true)
    })

    it('unsubscribe sends request and removes handler', () => {
      let sent
      const fakeClient = {
        send: (data) => {
          sent = JSON.parse(data)
        }
      }
      const proxy = api.pubsub(fakeClient)
      const handler = () => {}
      proxy.subscribe('my-topic', handler)
      proxy.unsubscribe('my-topic', handler)
      assert.equal(sent.url, 'pubsub')
      assert.equal(sent.params.topic, 'my-topic')
      assert.equal(sent.params.unsubscribe, true)
    })
  })

  describe('server proxy', () => {
    it('uptime sends correct request and returns result', async () => {
      const fakeClient = {
        readyState: 1,
        send: (data) => {
          const { id } = JSON.parse(data)
          setTimeout(() => pubsub.publish(id, 12345), 10)
        }
      }
      const result = await api.server(fakeClient).uptime()
      assert.equal(result, 12345)
    })

    it('ping sends correct request and returns latency', async () => {
      const fakeClient = {
        readyState: 1,
        send: (data) => {
          const { id } = JSON.parse(data)
          const now = new Date().getTime()
          setTimeout(() => pubsub.publish(id, now + 50), 10)
        }
      }
      const result = await api.server(fakeClient).ping()
      assert.equal(typeof result, 'number')
    })
  })

  describe('peernet proxy', () => {
    it('join sends request with join=true', async () => {
      let sent
      const fakeClient = {
        readyState: 1,
        send: (data) => {
          sent = JSON.parse(data)
          setTimeout(() => pubsub.publish(sent.id, 'joined'), 10)
        }
      }
      const result = await api
        .peernet(fakeClient)
        .join({ address: ['peer1'], peerId: 'peer1' })
      assert.equal(sent.url, 'peernet')
      assert.equal(sent.params.join, true)
      assert.equal(result, 'joined')
    })

    it('leave sends request with join=false', async () => {
      let sent
      const fakeClient = {
        readyState: 1,
        send: (data) => {
          sent = JSON.parse(data)
          setTimeout(() => pubsub.publish(sent.id, 'left'), 10)
        }
      }
      const result = await api
        .peernet(fakeClient)
        .leave({ address: ['peer1'], peerId: 'peer1' })
      assert.equal(sent.url, 'peernet')
      assert.equal(sent.params.join, false)
      assert.equal(result, 'left')
    })

    it('peers sends request with peers=true', async () => {
      let sent
      const fakeClient = {
        readyState: 1,
        send: (data) => {
          sent = JSON.parse(data)
          setTimeout(() => pubsub.publish(sent.id, ['p1', 'p2']), 10)
        }
      }
      const result = await api.peernet(fakeClient).peers()
      assert.equal(sent.url, 'peernet')
      assert.equal(sent.params.peers, true)
      assert.deepEqual(result, ['p1', 'p2'])
    })
  })
})

// --- ClientConnection unit tests ---

describe('ClientConnection', () => {
  let pubsub
  let api
  let fakeClient

  beforeEach(() => {
    pubsub = new LittlePubSub(false)
    globalThis.pubsub = pubsub
    api = new Api(pubsub)
    fakeClient = {
      readyState: 1,
      send: () => {},
      close: () => {}
    }
  })

  it('uptime returns elapsed time in ms', async () => {
    const conn = new ClientConnection(fakeClient, api)
    // wait a bit so uptime > 0
    await new Promise((r) => setTimeout(r, 50))
    const uptime = conn.uptime()
    assert.ok(uptime >= 40, `expected uptime >= 40ms, got ${uptime}`)
  })

  it('connectionState returns correct state', () => {
    const conn = new ClientConnection(fakeClient, api)
    assert.equal(conn.connectionState(), 'open')
  })

  it('close calls client.close', () => {
    let closed = false
    fakeClient.close = () => {
      closed = true
    }
    const conn = new ClientConnection(fakeClient, api)
    conn.close()
    assert.equal(closed, true)
  })

  it('request resolves with result', async () => {
    fakeClient.send = (data) => {
      const { id } = JSON.parse(data)
      setTimeout(() => pubsub.publish(id, 'the-result'), 10)
    }
    const conn = new ClientConnection(fakeClient, api)
    const result = await conn.request({ url: 'test' })
    assert.equal(result, 'the-result')
  })

  it('send delegates to api.send', () => {
    let sent
    fakeClient.send = (data) => {
      sent = JSON.parse(data)
    }
    const conn = new ClientConnection(fakeClient, api)
    conn.send({ url: 'hello', params: { key: 'val' } })
    assert.equal(sent.url, 'hello')
    assert.deepEqual(sent.params, { key: 'val' })
  })

  it('pubsub proxy is available', () => {
    const conn = new ClientConnection(fakeClient, api)
    assert.ok(conn.pubsub)
    assert.equal(typeof conn.pubsub.publish, 'function')
    assert.equal(typeof conn.pubsub.subscribe, 'function')
    assert.equal(typeof conn.pubsub.unsubscribe, 'function')
  })

  it('server proxy is available', () => {
    const conn = new ClientConnection(fakeClient, api)
    assert.ok(conn.server)
    assert.equal(typeof conn.server.uptime, 'function')
    assert.equal(typeof conn.server.ping, 'function')
  })

  it('peernet proxy is available', () => {
    const conn = new ClientConnection(fakeClient, api)
    assert.ok(conn.peernet)
    assert.equal(typeof conn.peernet.join, 'function')
    assert.equal(typeof conn.peernet.leave, 'function')
    assert.equal(typeof conn.peernet.peers, 'function')
  })
})

// --- SocketRequestClient with experimentalWebsocket ---

/**
 * Creates a mock WebSocket class that simulates connection lifecycle.
 * When autoOpen is true the 'open' event fires automatically.
 */
function createMockWebSocketClass({ autoOpen = true, messages = [] } = {}) {
  return class MockWebSocket {
    url
    protocol
    readyState = 0
    #eventListeners = {}

    constructor(url, protocol) {
      this.url = url
      this.protocol = protocol

      if (autoOpen) {
        setTimeout(() => {
          this.readyState = 1
          this.#emit('open', {})
          // deliver any queued messages after open
          for (const msg of messages) {
            setTimeout(
              () => this.#emit('message', { data: JSON.stringify(msg) }),
              5
            )
          }
        }, 5)
      }
    }

    addEventListener(event, handler) {
      if (!this.#eventListeners[event]) this.#eventListeners[event] = []
      this.#eventListeners[event].push(handler)
    }

    removeEventListener(event, handler) {
      if (!this.#eventListeners[event]) return
      this.#eventListeners[event] = this.#eventListeners[event].filter(
        (h) => h !== handler
      )
    }

    send(data) {
      const parsed = JSON.parse(data)
      // auto-respond with a success message for any request that has an id
      if (parsed.id) {
        setTimeout(() => {
          this.#emit('message', {
            data: JSON.stringify({
              id: parsed.id,
              value: `reply-to-${parsed.url}`,
              status: 200
            })
          })
        }, 5)
      }
    }

    close() {
      this.readyState = 3
      this.#emit('close', { code: 1000 })
    }

    #emit(event, data) {
      // property-based handler
      const propHandler = this['on' + event]
      if (typeof propHandler === 'function') propHandler(data)
      // addEventListener-based handlers
      for (const handler of this.#eventListeners[event] || []) {
        handler(data)
      }
    }
  }
}

describe('SocketRequestClient (experimentalWebsocket)', () => {
  let originalWebSocket

  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket
  })

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket
  })

  it('connects and returns a ClientConnection using addEventListener', async () => {
    globalThis.WebSocket = createMockWebSocketClass()
    const client = new SocketRequestClient('ws://localhost:9999', 'test', {
      retry: false,
      timeout: 1000,
      times: 1,
      experimentalWebsocket: true
    })
    const conn = await client.init()
    assert.ok(conn instanceof ClientConnection)
    assert.equal(typeof conn.request, 'function')
    assert.equal(typeof conn.close, 'function')
  })

  it('can send a request and receive a response', async () => {
    globalThis.WebSocket = createMockWebSocketClass()
    const client = new SocketRequestClient('ws://localhost:9999', 'test', {
      retry: false,
      timeout: 1000,
      times: 1,
      experimentalWebsocket: true
    })
    const conn = await client.init()
    const result = await conn.request({ url: 'ping' })
    assert.equal(result, 'reply-to-ping')
  })

  it('uptime returns elapsed time', async () => {
    globalThis.WebSocket = createMockWebSocketClass()
    const client = new SocketRequestClient('ws://localhost:9999', 'test', {
      retry: false,
      timeout: 1000,
      times: 1,
      experimentalWebsocket: true
    })
    const conn = await client.init()
    const uptime = conn.uptime()
    assert.equal(typeof uptime, 'number')
    assert.ok(uptime >= 0)
  })

  it('rejects when connection fails and retry is disabled', async () => {
    const NonOpeningWS = createMockWebSocketClass({ autoOpen: false })
    // Patch: fire close immediately instead of open
    const OrigCtor = NonOpeningWS
    globalThis.WebSocket = class extends OrigCtor {
      constructor(url, protocol) {
        super(url, protocol)
        setTimeout(() => {
          this.readyState = 3
          // fire close listeners
          const closeEvent = { code: 1006 }
          const propHandler = this['onclose'] || this.onclose
          if (typeof propHandler === 'function') propHandler(closeEvent)
        }, 5)
      }
    }
    const client = new SocketRequestClient('ws://localhost:9999', 'test', {
      retry: false,
      timeout: 100,
      times: 1,
      experimentalWebsocket: true
    })
    await assert.rejects(() => client.init())
  })

  it('pubsub proxy works over experimental connection', async () => {
    let sentData
    const MockWS = createMockWebSocketClass()
    const OrigMock = MockWS
    globalThis.WebSocket = class extends OrigMock {
      send(data) {
        sentData = JSON.parse(data)
        super.send(data)
      }
    }
    const client = new SocketRequestClient('ws://localhost:9999', 'test', {
      retry: false,
      timeout: 1000,
      times: 1,
      experimentalWebsocket: true
    })
    const conn = await client.init()
    await conn.pubsub.publish('my-topic', 'my-val')
    assert.equal(sentData.url, 'pubsub')
    assert.equal(sentData.params.topic, 'my-topic')
    assert.equal(sentData.params.value, 'my-val')
  })

  it('onmessage dispatches to pubsub correctly', async () => {
    globalThis.WebSocket = createMockWebSocketClass()
    const client = new SocketRequestClient('ws://localhost:9999', 'test', {
      retry: false,
      timeout: 1000,
      times: 1,
      experimentalWebsocket: true
    })
    const conn = await client.init()
    // request triggers send -> mock auto-responds -> onmessage fires -> pubsub publishes
    const result = await conn.request({ url: 'serverInfo' })
    assert.equal(result, 'reply-to-serverInfo')
  })

  it('onerror publishes to pubsub when error subscriber exists', async () => {
    globalThis.WebSocket = createMockWebSocketClass()
    const client = new SocketRequestClient('ws://localhost:9999', 'test', {
      retry: false,
      timeout: 1000,
      times: 1,
      experimentalWebsocket: true
    })
    const conn = await client.init()
    let errorReceived
    globalThis.pubsub.subscribe('error', (err) => {
      errorReceived = err
    })
    // trigger onerror via the client instance
    client.onerror('test-error')
    assert.equal(errorReceived, 'test-error')
  })
})
