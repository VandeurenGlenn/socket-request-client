(async () => {
  const requestClient = require('.');
  try {
    const client = await requestClient('ws://localhost:4455', 'disco');
    
    await client.pubsub.publish('hello', 'world from peer2')
    client.pubsub.subscribe('hello', value => console.log({result: value}))
    // await client.pubsub.unsubscribe('hello', value => console.log(value))
    const serverUptime = await client.server.uptime()
    const uptime = await client.uptime()
    const ping = await client.server.ping()
    await client.peernet.join({address: ['peer2'], peerId: 'peer2'})
    await client.pubsub.subscribe('peernet', cb => {
      console.log(cb);
    })
    const height = await client.request({url: 'chainHeight'})
    console.log({height});
  } catch (e) {
    console.error(e);
  } finally {
    
  }
  // process.exit()
})();



