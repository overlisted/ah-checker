const longPoll = require("./longpoll");
const logger = require("./log")

logger.initLog();
longPoll.run();
logger.writeLog("INFO", "Ready!");
