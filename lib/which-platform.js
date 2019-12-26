const { isWindows, isMac, isLinux } = require("platform-is");

module.exports = function() {
  if (isMac()) return "mac";
  if (isWindows()) return "windows";
  if (isLinux()) return "linux";
};
