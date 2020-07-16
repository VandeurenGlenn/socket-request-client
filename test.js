(async () => {
  const requestClient = require('.');
  try {
    const client = await requestClient('ws://localhost:4455', 'disco');
    
    await client.pubsub.subscribe('hello', value => console.log(value))
    await client.pubsub.publish('hello', 'world')
    // await client.pubsub.unsubscribe('hello', value => console.log(value))
    const serverUptime = await client.server.uptime()
    const uptime = await client.uptime()
    const ping = await client.server.ping()
    console.log(await client.request({url: 'chainHeight'}));
  } catch (e) {
    console.error(e);
  } finally {
    
  }
  // process.exit()
})();



