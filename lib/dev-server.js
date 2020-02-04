const express = require("express");
require("express-async-errors");
const app = express();
const PORT = 12549;
const path = require("path");

let server;
let node;

app.use(express.static(path.resolve(__dirname, "../public")));

app.get("/api/gen-one-block", async function(req, res) {
  if (!node) return res.status(402).send("node not running");
  await node.genOneBlock();
  res.status(200).send();
});

function start({
  port,
  verbose,
  accounts,
  genBlockInterval,
  genBlockManually,
  node: confluxLocalNode,
  devServer
}) {
  if (!devServer) return;
  node = confluxLocalNode;
  server = app.listen(PORT, () => {
    if (verbose) console.log(`dev-server listening on port ${PORT}`);
  });
}

function stop() {
  if (server) server.close();
  server = null;
  node = null;
}

module.exports = { start, stop };
