const { spawn } = require("child_process");
const { resolve } = require("path");
const rimraf = require("rimraf");

function start(
  binPath,
  { configPath = resolve(__dirname, "./conflux.conf"), verbose = false } = {}
) {
  const tmpdir = require("temp-dir");
  const node = spawn(
    binPath,
    ["--config", configPath, "--public-address", "127.0.0.1:32323"],
    { cwd: tmpdir }
  );

  if (DEBUG) {
    process.on("SIGINT", function() {
      rimraf.sync(tmpdir);
      process.exit(1);
    });
  }

  process.on("exit", async function() {
    await quit();
  });

  node.on("close", code => {
    console.log(`conflux node process exit with code ${code}`);
    rimraf(tmpdir);
  });

  node.stdout.on("data", data => {
    if (verbose) {
      console.log(data.toString());
    }
  });

  return new Promise((resolve, reject) => {
    node.stdout.on("data", () => {
      resolve(node);
    });
  });
}

function quit(retryCount = 0, sig = "SIGTERM") {
  return new Promise(resolve => {
    if (!this.node.kill(sig)) {
      if (retryCount > 9) {
        setTimeout(() => quit(++retryCount, "SIGKILL"), 100);
      } else if (retryCount > 19) {
        reject(new Error("can't kill conflux process"));
      } else {
        setTimeout(() => quit(++retryCount), 100);
      }
    } else {
      resolve(true);
    }
  });
}

module.exports = { start };
