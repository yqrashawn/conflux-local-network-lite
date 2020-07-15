/**
 * @fileOverview functions to interact with the fullnode
 * @name chain.js
 */
const jayson = require("jayson");
const client = jayson.client.http("http://localhost:12537");
const ethUtil = require("cfx-util");
const sleep = require("sleep-promise");
const { Account } = require("js-conflux-sdk");

let genBlockInterval = false;
let CHAINID;

const GENESIS_PRI_KEY =
  "0x46b9e861b63d3509c88b7817275a30d22d62c8cd8fa6486ddee35ef0d8e0495f";
const GENESIS_ADDRESS = "0x1be45681ac6c53d5a40475f7526bac1fe7590fb8";

async function sendCFX({ address, privateKey, balance }, cfx) {
  if (!address && !privateKey)
    throw new Error("must provide one of address or privateKey");

  if (!address && privateKey) {
    try {
      address =
        "0x" +
        ethUtil.privateToAddress(ethUtil.toBuffer(privateKey)).toString("hex");
    } catch (err) {
      throw new Error(`invalid private key ${privateKey}`);
    }
  } else if (typeof address === "string" && !address.startsWith("0x")) {
    address = `0x${address}`;
  }

  const genesisAccount = new Account(GENESIS_PRI_KEY);

  if (!CHAINID) {
    const { chainId } = await cfx.provider.call("cfx_getStatus");
    CHAINID = chainId;
  }
  const txParams = {
    from: genesisAccount,
    gasPrice: 10,
    value: balance,
    to: address,
    chainId: CHAINID
  };

  const transactionResult = await cfx
    .sendTransaction(txParams)
    .confirmed({ delta: 100 })
    .catch(err => {
      throw err;
    });

  const { transactionHash } = transactionResult;
  return await cfx.getTransactionReceipt(transactionHash).catch(err => {
    throw err;
  });
}

async function genOneBlock() {
  await new Promise((resolve, reject) => {
    client.request("generateoneblock", [10, 300000], function(
      err,
      error,
      result
    ) {
      if (err) reject(err);
      resolve(result);
    });
  }).catch(() => {});
}

async function startGenBlock({ interval = 0 } = {}) {
  if (genBlockInterval) return false;
  genBlockInterval = true;
  while (genBlockInterval) {
    await sleep(interval);
    await genOneBlock();
  }
  return true;
}

function stopGenBlock() {
  if (!genBlockInterval) return false;
  genBlockInterval = false;
  return true;
}

module.exports = { sendCFX, genOneBlock, startGenBlock, stopGenBlock };
