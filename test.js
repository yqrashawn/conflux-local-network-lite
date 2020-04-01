const Local = require("./index.js");
const server = new Local({ genBlockInterval: 300 });
server
  .start({
    accounts: [
      {
        secretKey:
          "0xA46F301E2D0AC3EE7B83303D93DD49C14CE8E18251EB623ED468AAA12F572E74",
        balance: 1e23
      }
    ]
  })
  .then(() => {
    process.exit();
  });
