const getBinary = require("./lib/getBinary.js");
const { start, quit } = require("./lib/server.js");
const Conflux = require("js-conflux-sdk");
const {
  startGenBlock,
  stopGenBlock,
  genOneBlock,
  sendCFX
} = require("./lib/chain.js");

let cfxNode;

class ConfluxNode {
  constructor({ verbose = false, genBlockInterval = 0, port = 12539 } = {}) {
    this.verbose = verbose;
    this.genBlockInterval = genBlockInterval;
    this.port = port;
  }

  async _findBinary() {
    if (!this.bin) {
      this.bin = await getBinary();
      console.log(
        `[conflux-local-network-lite] found conflux binary at\n  ${this.bin}`
      );
    }
    return this.bin;
  }

  get running() {
    if (!cfxNode) return false;
    return !cfxNode.killed;
  }

  async start({ verbose = false, accounts, genBlockInterval, port } = {}) {
    if (this.running) return;
    port = port || this.port;
    await this._findBinary();
    cfxNode = await start(this.bin, {
      verbose: verbose || this.verbose,
      port
    });
    this.web3 = new Conflux({ url: `http://localhost:${port}` });
    await genOneBlock();
    startGenBlock(
      genBlockInterval === undefined ? this.genBlockInterval : genBlockInterval
    );
    if (accounts) return await this.setupAccounts(accounts);
    return this;
  }

  async quit() {
    if (!this.running) return;
    stopGenBlock();
    await this._findBinary();
    await quit();
    cfxNode = null;
    return this;
  }

  async restart() {
    await this.quit();
    return await this.start(...arguments);
  }

  async setupAccounts(accounts) {
    if (!Array.isArray(accounts)) {
      throw new Error("accounts must be an array");
    }

    for (const account of accounts) {
      await this.sendCFX(account);
    }

    return this;
  }

  async sendCFX({ address, balance, secretKey, privateKey }) {
    if (secretKey) privateKey = secretKey;
    if (typeof balance !== "string") balance = balance.toString();
    await sendCFX({ address, balance, privateKey }, this.web3);
    return this;
  }

  changeGenBlockIntervalTo(interval = 0) {
    this.genBlockInterval = interval;
    stopGenBlock();
    startGenBlock(interval);
    return this;
  }
}

// const server = new ConfluxNode();
// server.start().then(console.log);

module.exports = ConfluxNode;
