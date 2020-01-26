# socket-request-client
> server <-> client connection with ease

## INSTALL 
```sh
npm i --save socket-request-client
```

## USAGE
```js
import clientConnection from 'socket-request-client';
const request = {url: 'user', params: {password: 'password', email:: 'email'}};

const client = await clientConnection('ws://localhost:4000')
// a request is client.on & client.send combined
const requested = await client.request(request);

// without async await
clientConnection('ws://localhost:4000').then(client => {  
  client.on('send', result => { console.log(result) });
  client.send(request);
})
```
### custom pubsub
```js
import clientConnection from 'socket-request-client';
import IpfsApi from 'ipfs-api';
const ipfs = new IpfsApi();

const request = {url: 'user', params: {password: 'password', email:: 'email'}};

const client = clientConnection('ws://localhost:4000', 'echo-protocol', {
  pubsub: ipfs.pubsub,
  retry: false
}).then(client => {
    client.on('send', result => { console.log(result) });
    client.send(request);
  });
```

## API
### socketRequestClient([options])

#### send
`request.url`<br>
`request.params`: <code>Object</code><br>
```js
client.send(request)
```

#### request
`request.url`<br>
`request.params`: <code>Object</code><br>
`returns`: `Promise`
```js
await client.request(request)
```

#### subscribe (local pubsub)
`name`: name of the channel to subscribe to<br>
`handler`: method<br>
`context`: context<br>
```js
client.subscribe('event-name', data => {
  console.log(data);
})
```
#### unsubscribe (local pubsub)
`name`: name of the channel to unsubscribe<br>
`handler`: method<br>
`context`: context<br>
```js
client.unsubscribe('event-name', data => {
  console.log(data);
})
```

#### publish (local pubsub)
`name`: name of the channel to publish to<br>
`handler`: method<br>
`context`: context<br>
```js
client.publish('event-name', 'data')
```
#### uptime
```js
await client.uptime()
```

#### pubsub.subscribe
`name`: name of the channel to subscribe to<br>
`handler`: method<br>
`context`: context<br>
```js
client.pubsub.subscribe('event-name', data => {
  console.log(data);
})
```
#### pubsub.unsubscribe
`name`: name of the channel to unsubscribe<br>
`handler`: method<br>
`context`: context<br>
```js
client.pubsub.unsubscribe('event-name', data => {
  console.log(data);
})
```

#### pubsub.publish
`name`: name of the channel to publish to<br>
`handler`: method<br>
`context`: context<br>
```js
client.pubsub.publish('event-name', 'data')
```

#### pubsub.subscribers
```js
client.pubsub.subscribers()
```

#### server.uptime
`returns`: `Promise`
```js
await client.server.uptime()
```

#### server.ping
`returns`: `Promise`
```js
await client.server.ping()
```
