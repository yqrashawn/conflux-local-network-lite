/**
 * @fileOverview wrapper function to determine the platform
 * @name which-platform.js
 */

const { isWindows, isMac, isLinux } = require("platform-is")
const os = require("os")

module.exports = function() {
  if (isMac() && os.cpus()?.[0]?.model?.includes("Apple M")) return "mac_arm"
  if (isMac()) return "mac"
  if (isWindows()) return "windows"
  if (isLinux()) return "linux"
}
