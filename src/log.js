const options = require("./options");
const fs = require("fs");
const util = require("./util");

const logFileStream;

function writeLog(severity, message) {
  const date = util.moment().format("hh:mm:ss.SS");
  logFileStream.write(options.logFile, `[${date}] [${severity}] ${message}`);
}

function initLog() {
  logFileStream = fs.createWriteStream(options.logFile, {flags: "a"});
}

module.exports = {
  initLog: initLog,
  writeLog: writeLog
};
