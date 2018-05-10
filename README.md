# socket-request-client
> socket-request-server client connection with ease
 
## usage
### defaults
```js
import clientConnection from 'socket-request-client';
const request = {url: 'user', params: {password: 'password', email:: 'email'}};

const client = await clientConnection(6000, 'echo-protocol')
// a request is client.on & client.send combined
const requested = await client.request(request);

// without async await
clientConnection(6000, 'echo-protocol').then(client => {  
  client.on('send', result => { console.log(result) });
  client.send(request);
})
```
### custom pubsub
```js
import clientConnection from 'socket-request-client';
import IpfsApi from 'ipfs-api';
const ipfs = new IpfsApi();
const options = {
  pubsub: ipfs.pubsub
}

const request = {url: 'user', params: {password: 'password', email:: 'email'}};

const client = clientConnection(6000, 'echo-protocol', ipfs.pubsub)
  .then(client => {
    client.on('send', result => { console.log(result) });
    client.send(request);
  });
```
