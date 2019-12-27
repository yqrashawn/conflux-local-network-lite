const getBinary = require("./lib/getBinary.js");
const { start, quit } = require("./lib/server.js");
const ConfluxWeb = require("conflux-web");

let cfxNode;

class ConfluxNode {
  constructor({ verbose = false } = {}) {
    this.verbose = verbose;
  }

  async _findBinary() {
    if (!this.bin) this.bin = await getBinary();
    return this.bin;
  }

  get running() {
    if (!cfxNode) return false;
    return !cfxNode.killed;
  }

  async start(opt) {
    if (this.running) return;
    await this._findBinary();
    cfxNode = await start(this.bin, { verbose: this.verbose });
    this.web3 = new ConfluxWeb({ url: "http://localhost:12539" });
    this.genWallet();
    return this;
  }

  async quit(retryCount = 0, sig = "SIGTERM") {
    if (!this.running) return;
    await this._findBinary();
    await quit();
    cfxNode = null;
    return this;
  }

  async restart() {
    await this.quit();
    return await this.start();
  }

  genWallet() {
    this.wallet = this.web3.wallet.create();
    return this.wallet;
  }
}

// const server = new ConfluxNode();
// server.start().then(console.log);

module.exports = ConfluxNode;
