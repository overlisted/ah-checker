const options = require("./options");
const fs = require("fs");
const util = require("./util");

let logFileStream;

function writeLog(severity, message) {
  const date = util.moment().format("hh:mm:ss.SS");
  const line = `[${date}] [${severity}] ${message}`;
  logFileStream.write(line + "\n");

  util.sendMessage(util.adminID, "[ah-checker]" + line);
}

function initLog() {
  fs.truncateSync(options.logFile, 0);
  logFileStream = fs.createWriteStream(options.logFile, {flags: "a"});
}

module.exports = {
  initLog: initLog,
  writeLog: writeLog
};
