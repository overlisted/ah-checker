const longPoll = require("./longpoll");
const logger = require("./log")

longPoll.run();
logger.writeLog("INFO", "Ready!");
