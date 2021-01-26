const getBinary = require("./lib/getBinary.js");
const { start, quit } = require("./lib/server.js");
const { Conflux } = require("js-conflux-sdk");
const {
  startGenBlock,
  stopGenBlock,
  genOneBlock,
  sendCFX
} = require("./lib/chain.js");

const devServer = require("./lib/dev-server.js");

const DEFAULT_GEN_BLOCK_INTERVAL = 300;
const DEFAULT_PORT = 12537;

let cfxNode;

/**
 * a fullnode controller with methods to start/quit/... a fullnode
 *
 * @class ConfluxNode
 */
class ConfluxNode {
  /**
   * Creates an instance of ConfluxNode.
   * @param {*} [opts={}] fullnode controller base options
   * @param {Array} [opts.accounts=[]] a array of accounts to specify initial balance, [{ secretKey: "0xPrivateKey", balance: 1e23 }]
   * @param {boolean} [opts.verbose=false] show more info?
   * @param {number} [opts.genBlockInterval=300] the interval of automatically generating block
   * @param {boolean} [opts.genBlockManually=false] won't automatically generate block if set to true, better use with opts.devServer
   * @param {boolean} [opts.devServer=false] serve a page at http://localhost:12549 with a gen block button to manually generate block if set to true
   * @param {number} [opts.devServer=12537] fullnode rpc http port
   * @param {boolean} [opts.killPortProcess=false] kill other process occupying the port if set to true
   * @memberof ConfluxNode
   */
  constructor(opts = {}) {
    this._parseOptions(opts);
  }

  _parseOptions(opts) {
    if (!this.opts) this.opts = {};

    Object.assign(
      this.opts,
      {
        accounts: [],
        verbose: false,
        genBlockInterval: DEFAULT_GEN_BLOCK_INTERVAL,
        port: DEFAULT_PORT,
        genBlockManually: false,
        devServer: false,
        killPortProcess: false
      },
      opts
    );
  }

  /**
   * parse options from controller.start, fallback to base options, won't overwrite base options
   *
   * @param {*} opts
   * @returns {Object} parsed options
   * @memberof ConfluxNode
   */
  _parseStartOptions(opts) {
    return Object.assign({}, this.opts, opts);
  }

  /**
   * internal method to download the fullnode binary
   *
   * @returns {Promise<string>} the fullnode binary path on local machine
   * @memberof ConfluxNode
   */
  async _findBinary() {
    if (!this.bin) {
      this.bin = await getBinary();
      console.log(
        `[conflux-local-network-lite] found conflux binary at\n  ${this.bin}`
      );
    }
    return this.bin;
  }

  /**
   * is fullnode running?
   *
   * @readonly
   * @memberof ConfluxNode
   */
  get running() {
    if (!cfxNode) return false;
    return !cfxNode.killed;
  }

  /**
   * start the fullnode
   *
   * @param {*} [opts={}] same options as the class constructor, opts will fallback to the base options passed into constructor, won't mutate the base opts
   * @returns {Object ConfluxNode instance
   * @memberof ConfluxNode
   */
  async start(opts = {}) {
    if (this.running) return;

    opts = this._parseStartOptions(opts);

    const { port, accounts, genBlockManually } = opts;

    if (!(await this._findBinary())) return;

    cfxNode = await start(this.bin, opts);

    this.cfx = new Conflux({
      url: `http://localhost:${port}`,
      chainId: "0xbb7",
      networkId: 2999
    });

    if (!genBlockManually) {
      startGenBlock(opts);
    }

    devServer.start({ ...opts, node: this });

    if (accounts) {
      await this.setupAccounts(accounts);
      await genOneBlock();
    }

    return this;
  }

  /**
   * quit the fullnode and the dev server if there is one
   *
   * @returns {Object} ConfluxNode instance
   * @memberof ConfluxNode
   */
  async quit() {
    if (!this.running) return;
    stopGenBlock();
    await this._findBinary();
    await quit();
    devServer.stop();
    cfxNode = null;
    return this;
  }

  /**
   * quit and start, accept same arguments with ConfluxNode.prototype.start
   *
   * @returns {Object} ConfluxNode instance
   * @memberof ConfluxNode
   */
  async restart() {
    await this.quit();
    return await this.start(...arguments);
  }

  /**
   * accept accounts same with the accounts in constructor options
   *
   * @param {Array[Object]} accounts a array of accounts to specify initial balance, [{ secretKey: "0xPrivateKey", balance: 1e23 }]
   * @returns {Object} ConfluxNode instance
   * @memberof ConfluxNode
   */
  async setupAccounts(accounts) {
    if (!Array.isArray(accounts)) {
      throw new Error("accounts must be an array");
    }

    for (const account of accounts) {
      await this.sendCFX(account);
    }

    return this;
  }

  /**
   * send some cfx from genesis account to the specified account
   *
   * @param {*} { address, balance, secretKey, privateKey }  eg. { secretKey: "0xPrivateKey", balance: 1e23 }
   * @returns [Object] ConfluxNode instance
   * @memberof ConfluxNode
   */
  async sendCFX({ address, balance, secretKey, privateKey }) {
    if (secretKey) privateKey = secretKey;
    if (typeof balance !== "string") balance = `0x${balance.toString(16)}`;
    await sendCFX({ address, balance, privateKey }, this.cfx);
    return this;
  }

  /**
   * generate one block, do nothing if fullnode not running
   *
   * @returns [Promise<Object>] Promise of ConfluxNode instance
   * @memberof ConfluxNode
   */
  async genOneBlock() {
    if (!this.running) return;
    await genOneBlock();
    return this;
  }

  /**
   * start or restart automatically generating block
   *
   * @param {number} [interval=DEFAULT_GEN_BLOCK_INTERVAL] interval to automatically generating block
   * @returns {Object} ConfluxNode instance
   * @memberof ConfluxNode
   */
  restartGenBlock(interval = DEFAULT_GEN_BLOCK_INTERVAL) {
    stopGenBlock();
    startGenBlock({ interval });
    return this;
  }
}

module.exports = ConfluxNode;
