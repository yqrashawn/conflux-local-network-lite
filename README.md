# conflux-local-network-lite

Start a conflux local network from nodejs.  

## Features

- download conflux binary depends on system type (only support ubuntu when using
  linux)
- start/restart/quit a conflux node locally
- create accounts with specified balance on start/restart

## Note
- The latest version don't support windows , don't have the conflux windows
  binary yet.

## Install
``` shell
npm i -D @yqrashawn/conflux-local-network-lite
yarn add --dev @yqrashawn/conflux-local-network-lite
```

## Examples

### Start server
``` javascript
const ConfluxLocalNetworkLite = require("@yqrashawn/conflux-local-network-lite");
(async () => {
  const server = new ConfluxLocalNetworkLite();
  await server.start({
    verbose: false, // show log of conflux node
    accounts: [
      // initialize accounts with specified gdrip balance
      {
        address: "0x91e36D5f4ce79054e2e7811132860469d6E802d6",
        balance: 100000000000000000000
      }
    ],
    genBlockInterval: 1000 // gen one block per 1000 ms
  });
  // it has a conflux-web instance in it
  console.log(server.cfx);
  // it will generate a wallet and account automatically
  console.log(server.wallet);
})();
```

A conflux node will be start at `localhost:12539`.  

### Stop server

``` javascript
await server.quit().catch(() => console.log('failed to quit'));
```

### Restart server

``` javascript
await server.restart(); // accepts the same arguments as server.start
```

Check out [index.js](./index.js)  for more information.  