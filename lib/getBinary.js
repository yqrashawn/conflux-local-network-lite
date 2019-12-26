const {
  existsSync,
  createReadStream,
  createWriteStream,
  chmodSync
} = require("fs");
const { stream } = require("got");
const { homedir } = require("os");
const { resolve } = require("path");
const { pipeline } = require("stream");
const mkdirp = require("make-dir");
const { promisify } = require("util");
const { Extract } = require("unzip-stream");
const whichPlatform = require("./which-platform.js");
const DOWNLOAD_URL = require("./download-url.json");

const ppipeline = promisify(pipeline);

const CONFLUX_PATH = resolve(homedir(), "./.conflux-bin");

async function downloadAndExtract(url) {
  console.log(`[cfx_local_network_lite] Downloading binary from ${url}`);
  await mkdirp(CONFLUX_PATH);
  await ppipeline(
    stream(url),
    Extract({ path: resolve(CONFLUX_PATH, "conflux") })
  );
  chmodSync(resolve(CONFLUX_PATH, "./conflux/run/conflux"), "777");
  return resolve(CONFLUX_PATH, "./conflux/run/conflux");
}

async function downloadBinary() {
  return await downloadAndExtract(DOWNLOAD_URL[whichPlatform()]);
}

async function getBinary() {
  if (
    process.env.CONFLUX_BIN_PATH &&
    !process.env.CONFLUX_BIN_PATH.endsWith("/conflux")
  )
    throw new Error("CONFLUX_BIN_PATH must be end with /conflux");

  if (existsSync(resolve(CONFLUX_PATH, "./conflux/run/conflux")))
    return resolve(CONFLUX_PATH, "./conflux/run/conflux");

  if (
    process.env.CONFLUX_BIN_PATH &&
    existsSync(process.env.CONFLUX_BIN_PATH)
  ) {
    return process.env.CONFLUX_BIN_PATH;
  }

  return await downloadBinary();
}

module.exports = getBinary;
