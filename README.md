# socket-request-client
> socket-request-server client connection with ease
 
## usage
```js
import clientConnection from 'socket-request-client';
const request = {url: 'user', params: {password: 'password', email:: 'email'}};

const client = clientConnection(6000, 'echo-protocol').then(client => {
  client.request(request).then(result => {
    console.log(result);
  });
  // or
  client.on('send', result => { console.log(result) });
  client.send(request);
});
```
