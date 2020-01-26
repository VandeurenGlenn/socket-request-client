(async () => {
  const requestClient = require('.');
  const client = await requestClient('ws://localhost:4000', 'disco');
  
  await client.pubsub.subscribe('hello', value => console.log(value))
  await client.pubsub.publish('hello', 'world')
  await client.pubsub.unsubscribe('hello', value => console.log(value))
  const serverUptime = await client.server.uptime()
  const uptime = await client.uptime()
  
  process.exit()
})();



