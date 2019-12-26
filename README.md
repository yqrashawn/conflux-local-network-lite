# conflux-local-network-lite

Start a conflux local network from nodejs.  

``` shell
npm i -D @yqrashawn/conflux-local-network-lite
yarn add --dev @yqrashawn/conflux-local-network-lite
```

## Example

### Start server
``` javascript
const ConfluxLocalNetworkLite = require('@yqrashawn/conflux-local-network-lite');
(async () => {
  const server = await new ConfluxLocalNetworkLite();
  // it has a conflux-web instance in it
  console.log(server.web3);
  // it will generate a wallet and account automatically
  console.log(server.wallet);
})();
```

A conflux node will be start at `localhost:12539`.  

### Stop server

``` javascript
await server.quit().catch(() => console.log('failed to quit'));
```

### Restart

Just regenerate a wallet and account.  

``` javascript
server.restart();
```

### Real restart

``` javascript
await server.hardRestart();
```

Check out [index.js](./index.js)  for more information.  