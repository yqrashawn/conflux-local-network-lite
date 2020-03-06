const Local = require('./index.js');
const server = new Local();
server.start().then(() => {
  process.exit();
})