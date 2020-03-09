const Local = require('./index.js');
const server = new Local({ genBlockInterval: 300 });
server.start({
  accounts: [
    {
      secretKey:
      '0xCA17316C298AC00F746B5F90330191EB08FC446A1A8A91D1F97E1F9588DBDD91',
      balance: 1e23,
    },
  ],
}).then(() => {
  process.exit();
})