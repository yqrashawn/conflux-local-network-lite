const getBinary = require("./lib/getBinary.js");
const { start, quit } = require("./lib/server.js");
const Conflux = require("js-conflux-sdk");
const {
  startGenBlock,
  stopGenBlock,
  genOneBlock,
  sendCFX
} = require("./lib/chain.js");

const devServer = require("./lib/dev-server.js");

const DEFAULT_GEN_BLOCK_INTERVAL = 300;
const DEFAULT_PORT = 12539;

let cfxNode;

class ConfluxNode {
  constructor(opts) {
    this._parseOptions(opts);
  }

  _parseOptions({
    verbose = false,
    genBlockInterval = DEFAULT_GEN_BLOCK_INTERVAL,
    port = DEFAULT_PORT,
    genBlockManually = false,
    devServer = false
  } = {}) {
    this.verbose = verbose;
    this.genBlockInterval = genBlockInterval;
    this.genBlockManually = genBlockManually;
    this.devServer = devServer;
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

  _parseStartOptions({
    verbose = false,
    accounts = [],
    genBlockInterval,
    port,
    genBlockManually
  } = {}) {
    return {
      port: port || this.port,
      verbose: verbose || this.verbose,
      accounts,
      genBlockInterval: genBlockInterval || this.genBlockInterval,
      genBlockManually: genBlockManually || this.genBlockManually
    };
  }

  async start(opts) {
    if (this.running) return;

    opts = this._parseStartOptions(opts);

    const {
      port,
      verbose,
      accounts,
      genBlockInterval,
      genBlockManually
    } = opts;

    if(!(await this._findBinary())) return;

    cfxNode = await start(this.bin, {
      verbose,
      port
    });

    this.web3 = new Conflux({ url: `http://localhost:${port}` });

    if (!genBlockManually) {
      startGenBlock(
        genBlockInterval === undefined
          ? this.genBlockInterval
          : genBlockInterval
      );
    }

    if (accounts) {
      await this.setupAccounts(accounts);
      await genOneBlock();
    }

    devServer.start({ ...opts, node: this });

    return this;
  }

  async quit() {
    if (!this.running) return;
    stopGenBlock();
    await this._findBinary();
    await quit();
    devServer.stop();
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

  async genOneBlock() {
    await genOneBlock();
    return this;
  }

  changeGenBlockIntervalTo(interval = DEFAULT_GEN_BLOCK_INTERVAL) {
    this.genBlockInterval = interval;
    stopGenBlock();
    startGenBlock(interval);
    return this;
  }
}

// const server = new ConfluxNode();
// server.start().then(console.log);

module.exports = ConfluxNode;
