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

const HOME_CONFLUX_PATH = resolve(homedir(), "./.conflux-bin");
const CONFLUX_PATH =
  whichPlatform() === "linux"
    ? resolve(__dirname, "./.conflux-bin")
    : HOME_CONFLUX_PATH;
const RELATIVE_BINARY_PATH = whichPlatform() === "windows"
      ? "./conflux/run/conflux.exe"
      : "./conflux/run/conflux"

async function downloadAndExtract(url) {
  console.log(
    `[cfx_local_network_lite] Downloading binary\n from ${url}\n  to ${CONFLUX_PATH}`
  );
  await mkdirp(CONFLUX_PATH);
  const extractStream = Extract({ path: resolve(CONFLUX_PATH, "conflux") });
  await ppipeline(stream(url), extractStream);
  const binaryPath = resolve(CONFLUX_PATH, RELATIVE_BINARY_PATH);
  if (!(await existsSync(binaryPath)) ) throw new Error('Download failed');
  return new Promise(r => {
    extractStream.on("close", function() {
      chmodSync(binaryPath, "777");
      r(resolve(CONFLUX_PATH, RELATIVE_BINARY_PATH));
    });
  });
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

  if (existsSync(resolve(process.cwd(), "./.conflux-bin/run/conflux")))
    return resolve(process.cwd(), "./.conflux-bin/run/conflux");

  if (existsSync(resolve(CONFLUX_PATH, RELATIVE_BINARY_PATH)))
    return resolve(CONFLUX_PATH, RELATIVE_BINARY_PATH);

  if (
    process.env.CONFLUX_BIN_PATH &&
    existsSync(process.env.CONFLUX_BIN_PATH)
  ) {
    return process.env.CONFLUX_BIN_PATH;
  }

  return await downloadBinary()
}

module.exports = getBinary;
