const { spawn } = require("child_process");
const { resolve } = require("path");
const rimraf = require("rimraf");
const { dirSync } = require("tmp");
const { kill: killPort } = require("cross-port-killer");
const realExecutablePath = require("real-executable-path");

const LOG_PREFIX = "[conflux-local-network-lite]";
let cfxNode;

async function start(
  binPath,
  {
    configPath = resolve(__dirname, "./conflux.conf"),
    verbose = false,
    port = 12539,
    killPortProcess = false
  } = {},
  retryCount = 0
) {
  const startFullNode = function() {
    return new Promise((resolve, reject) => {
      if (cfxNode && !cfxNode.killed) resolve(cfxNode);
      else if (cfxNode) cfxNode = null;

      const { name: tmpdir } = dirSync({ mode: 0774 });
      try {
        cfxNode = spawn(
          binPath,
          ["--config", configPath, "--public-address", "127.0.0.1:32323"],
          { cwd: tmpdir }
        );
      } catch (err) {
        if (retryCount < 5) {
          console.log(`${LOG_PREFIX} start failed, retry ${retryCount}`);
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
            `${LOG_PREFIX} conflux node process exit with code ${code}`
          );
        }
        rimraf.sync(tmpdir);
      });

      cfxNode.stderr.on("data", data => {
        console.error(`${LOG_PREFIX} cfx node error:
${data}`);
      });

      cfxNode.stdout.on("data", data => {
        const out = data.toString();
        if (verbose) {
          console.log(out);
        }
        if (
          out.includes("cfxcore::sync::synchronization_phases - start phase")
        ) {
          resolve(cfxNode);
        }
      });
    });
  };

  let hasLsof = false;
  hasLsof = await realExecutablePath("lsof").catch(() => {});
  if (killPortProcess && !hasLsof)
    console.warn(`${LOG_PREFIX} No lsof found, won't kill port process`);

  if (killPortProcess && hasLsof) {
    await killPort(port).catch(() => {});
    return await startFullNode();
  }

  return await startFullNode();
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
