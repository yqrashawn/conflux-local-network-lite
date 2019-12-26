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
      console.log("cleanup");
      rimraf(tmpdir, () => {
        process.exit(1);
      });
    });
  }

  node.on("close", code => {
    console.log(`conflux node process exit with code ${code}`);
    rimraf(tmpdir, () => {
      process.exit(code);
    });
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

module.exports = { start };
