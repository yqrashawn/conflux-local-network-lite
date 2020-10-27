# @cfxjs/fullnode

Start a conflux local network from nodejs.  

## Features

- Download conflux binary depends on system type 
- Start/restart/quit a conflux node locally
- Initialize accounts with specified balance on start/restart

## Note
- The latest version may not support windows.

## Install
``` shell
npm i -D @cfxjs/fullnode
yarn add --dev @cfxjs/fullnode
```

## Examples

### Start server
``` javascript
const Node = require("@cfxjs/fullnode");
(async () => {
  const node = new Node({accounts: [
      // initialize accounts with specified gdrip balance
      {
        address: "0x91e36D5f4ce79054e2e7811132860469d6E802d6",
        balance: 100000000000000000000
      }
    ]});
  await node.start();
  // it has a js-conflux-sdk instance in it
  console.log(node.cfx);
})();
```

A conflux node will be start at `localhost:12537` be default.  

### Stop server

``` javascript
await server.quit().catch(() => console.log('failed to quit'));
```

### Restart server

``` javascript
await server.restart(); // accepts the same arguments as server.start
```

Check out [index.js](./index.js)  for more information.  