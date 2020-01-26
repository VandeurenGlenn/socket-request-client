# socket-request-client
> socket-request-server client connection with ease

## usage
### defaults
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
