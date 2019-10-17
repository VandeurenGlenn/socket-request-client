# socket-request-client
> socket-request-server client connection with ease

## usage
### defaults
```js
import clientConnection from 'socket-request-client';
const request = {url: 'user', params: {password: 'password', email:: 'email'}};

const client = await clientConnection({port: 6000})
// a request is client.on & client.send combined
const requested = await client.request(request);

// without async await
clientConnection({
  port: 6000,
  address: '0.0.0.0',
}).then(client => {  
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
  port: 6000,
  protocol: 'echo-protocol',
  address: '0.0.0.0',
  pubsub: ipfs.pubsub
}

const request = {url: 'user', params: {password: 'password', email:: 'email'}};

const client = clientConnection(options).then(client => {
    client.on('send', result => { console.log(result) });
    client.send(request);
  });
```
