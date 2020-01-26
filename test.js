(async () => {
  const requestClient = require('.');
  const client = await requestClient('wss://star.leofcoin.org/disco', 'disco');
  
  await client.pubsub.subscribe('hello', value => console.log(value))
  await client.pubsub.publish('hello', 'world')
  await client.pubsub.unsubscribe('hello', value => console.log(value))
  
  process.exit()
})();



