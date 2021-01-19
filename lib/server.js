/**
 * @fileOverview functions to start/quit the fullnode
 * @name server.js
 */
const { spawn } = require("child_process");
const { resolve } = require("path");
const rimraf = require("rimraf");
const { dirSync } = require("tmp");
const { kill: killPort } = require("cross-port-killer");
const realExecutablePath = require("real-executable-path");
const { Conflux } = require("js-conflux-sdk");
const pretry = require("p-retry");
const delay = require("delay");

const LOG_PREFIX = "[conflux-local-network-lite]";
let cfxNode;

async function start(
  binPath,
  {
    configPath = resolve(__dirname, "./conflux.conf"),
    verbose = false,
    port = 12537,
    killPortProcess = false
  } = {},
  retryCount = 0
) {
  const startFullNode = function() {
    return new Promise((resolve, reject) => {
      // already started
      if (cfxNode && !cfxNode.killed) resolve(cfxNode);
      else if (cfxNode) cfxNode = null;

      // tmp cwd
      const { name: tmpdir } = dirSync();

      try {
        cfxNode = spawn(binPath, ["--config", configPath], { cwd: tmpdir });
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
      });

      const cfx = new Conflux({ url: `http://localhost:${port}` });

      console.log(`${LOG_PREFIX} Waiting for fullnode`);
      Promise.all([
        pretry(_untilFullnodeReady.bind(cfx), {
          retries: 100,
          onFailedAttempt: async () => {
            await delay(100);
          }
        }).then(() => {
          console.log(`${LOG_PREFIX} fullnode is ready!`);
          return true;
        }),
        pretry(_untilFullnodeCaughtUp.bind(cfx), {
          retries: 50,
          onFailedAttempt: async () => {
            await delay(100);
          }
        }).then(() => {
          console.log(`${LOG_PREFIX} fullnode caught up!`);
          resolve(cfxNode);
        })
      ]).then(() => resolve(cfxNode));
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

async function _untilFullnodeReady() {
  const epochNumber = await this.getEpochNumber.call(this, "latest_state");
  if (process.env.CFX_LITE_NODE_ENV === "debug")
    console.log("epochNumber = ", epochNumber);
  return epochNumber;
}

/**
 * throw error if fullnode not in "NormalSyncPhase" phase
 */
async function _untilFullnodeCaughtUp() {
  const phase = await this.provider.call("current_sync_phase");
  if (process.env.CFX_LITE_NODE_ENV === "debug") console.log("phase = ", phase);
  if (phase === "NormalSyncPhase") return true;
  throw new Error("not in normal sync phase");
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
