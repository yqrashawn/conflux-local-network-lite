/**
 * @fileOverview wrapper function to determine the platform
 * @name which-platform.js
 */

const { isWindows, isMac, isLinux } = require("platform-is");

module.exports = function() {
  if (isMac()) return "mac";
  if (isWindows()) return "windows";
  if (isLinux()) return "linux";
};
