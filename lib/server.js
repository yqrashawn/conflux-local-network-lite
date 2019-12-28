const { spawn } = require("child_process");
const { resolve } = require("path");
const rimraf = require("rimraf");
const { dirSync } = require("tmp");

let cfxNode;

function start(
  binPath,
  { configPath = resolve(__dirname, "./conflux.conf"), verbose = false } = {},
  retryCount = 0
) {
  return new Promise((resolve, reject) => {
    if (cfxNode && !cfxNode.killed) resolve(cfxNode);
    else if (cfxNode) cfxNode = null;

    const { name: tmpdir } = dirSync();
    try {
      cfxNode = spawn(
        binPath,
        ["--config", configPath, "--public-address", "127.0.0.1:32323"],
        { cwd: tmpdir }
      );
    } catch (err) {
      if (retryCount < 5) {
        console.log(
          `[conflux-local-network-lite] start failed, retry ${retryCount}`
        );
        setTimeout(() => {
          resolve(start(...[arguments[0], arguments[1], retryCount++]));
        }, 100);
      } else reject(err);
      return;
    }
    if (!cfxNode) return;

    if (process.env.CFX_LITE_NODE_ENV === "debug") {
      process.on("SIGINT", function() {
        rimraf.sync(tmpdir);
        process.exit(1);
      });
    }

    process.on("exit", function() {
      cfxNode.kill();
    });

    cfxNode.on("exit", code => {
      if (verbose) {
        console.log(
          `[conflux-local-network-lite] conflux node process exit with code ${code}`
        );
      }
      rimraf.sync(tmpdir);
    });

    cfxNode.stderr.on("data", data => {
      console.error(`[conflux-local-network-lite] cfx node error:
${data}`);
    });

    cfxNode.stdout.on("data", data => {
      const out = data.toString();
      if (verbose) {
        console.log(out);
      }
      if (
        out.includes(
          "cfxcore::sync::synchronization_protocol_handler - Catch-up mode"
        )
      ) {
        resolve(cfxNode);
      }
    });
  });
}

function quit(retryCount = 0, sig = "SIGTERM") {
  return new Promise((resolve, reject) => {
    if (!cfxNode || cfxNode.killed) resolve(true);

    if (!retryCount)
      cfxNode.on("exit", code => {
        resolve(code);
      });

    if (!cfxNode.kill(sig)) {
      if (retryCount > 9 && retryCount < 19) {
        setTimeout(() => quit(++retryCount, "SIGKILL"), 100);
      } else if (retryCount > 19) {
        reject(new Error("can't kill conflux process"));
      } else {
        setTimeout(() => quit(++retryCount), 100);
      }
    }
  });
}

module.exports = { start, quit };
