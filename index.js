const getBinary = require("./lib/getBinary.js");
const { start } = require("./lib/server.js");
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

  quit(retryCount = 0, sig = "SIGTERM") {
    return new Promise(resolve => {
      if (!this.running) resolve(this);
      if (!this.node.kill(sig)) {
        if (retryCount > 9) {
          setTimeout(() => this.quit(++retryCount, "SIGKILL"), 100);
        } else if (retryCount > 19) {
          reject(new Error("can't kill conflux process"));
        } else {
          setTimeout(() => this.quit(++retryCount), 100);
        }
      } else {
        this.running = false;
        resolve(this);
      }
    });
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
