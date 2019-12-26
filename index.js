const getBinary = require("./lib/getBinary.js");
const { start, quit } = require("./lib/server.js");
const ConfluxWeb = require("conflux-web");

class ConfluxNode {
  constructor({ verbose = false } = {}) {
    return (async () => {
      await this._findBinary();
      await this.start(...arguments);
      return this;
    })();
  }

  async _findBinary() {
    if (!this.bin) this.bin = await getBinary();
    return this.bin;
  }

  async start(opt) {
    if (this.running) return;
    this.node = await start(this.bin, opt);
    this.running = true;
    this.web3 = new ConfluxWeb({ url: "http://localhost:12539" });
    this.genWallet();
    return this;
  }

  async quit(retryCount = 0, sig = "SIGTERM") {
    await quit();
    return this;
  }

  async hardRestart() {
    await this.quit();
    return await this.start();
  }

  restart() {
    this.genWallet();
    return this;
  }

  genWallet() {
    this.wallet = this.web3.wallet.create();
    return this.wallet;
  }
}

// global.DEBUG = true;
// new ConfluxNode();

module.exports = ConfluxNode;
