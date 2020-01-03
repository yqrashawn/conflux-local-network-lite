const jayson = require("jayson");
const client = jayson.client.http("http://localhost:12537");
const ethUtil = require("ethereumjs-util");

const GENESIS_PRI_KEY =
  "0x46b9e861b63d3509c88b7817275a30d22d62c8cd8fa6486ddee35ef0d8e0495f";
const GENESIS_ADDRESS = "0xfbe45681ac6c53d5a40475f7526bac1fe7590fb8";

async function sendCFX({ address, privateKey, balance }, web3) {
  if (!address && !privateKey)
    throw new Error("must provide one of address or privateKey");

  if (!address && privateKey) {
    try {
      address =
        "0x" +
        ethUtil.privateToAddress(ethUtil.toBuffer(privateKey)).toString("hex");
    } catch (err) {
      throw new Error(`invliad private key ${privateKey}`);
    }
  } else if (
    typeof account.address === "string" &&
    !account.address.startsWith("0x")
  ) {
    account.address = `0x${account.address}`;
  }

  const genesisAccount = web3.wallet.add(GENESIS_PRI_KEY);

  const nonceValue = await web3.getTransactionCount(GENESIS_ADDRESS);
  const gasPrice = await web3.getGasPrice();
  const txParms = {
    from: genesisAccount,
    nonce: nonceValue,
    gasPrice: 100,
    data: "0x00",
    value: balance,
    to: address
  };

  const gas = await web3.estimateGas(txParms);
  txParms.gas = gas;
  const txHash = await web3.sendTransaction(txParms);
  return await waitBlock(txHash, address, web3);
}

async function waitBlock(txHash, TO_ACCOUNT, web3, retryCount = 0) {
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

  const receipt = await web3.getTransactionReceipt(txHash);
  if (receipt === null) {
    retryCount++;
    return await waitBlock(txHash, TO_ACCOUNT, web3, retryCount);
  }

  return receipt;
}

module.exports = sendCFX;
