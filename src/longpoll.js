const util = require("./util");
const commands = require("./commands");
const logger = require("./log");

async function longPollWorker(response) {
  response.updates.forEach(async it => {
    if(it.type === "message_new") commands.find(it.object.message);
  })
}

async function getNewLongPollServer() {
  try {
    return (await util.requireVKAPI("groups.getLongPollServer", `group_id=${util.groupID}`)).response;
  } catch(e) {
    logger.writeLog("FATAL", "Can't get long poll server: " + e.message);
  }
}

async function runLongPoll() {
  let longPoll = await getNewLongPollServer();

  while(true) {
    const response = await util.fetchJSON(
      `${longPoll.server}?act=a_check&key=${longPoll.key}&wait=25&mode=2&ts=${longPoll.ts}`
    );

    if(response.updates) {
      await longPollWorker(response);
      longPoll.ts = response.ts;
    } else if(response.failed === 2 || response.failed === 3) {
      longPoll = await getNewLongPollServer();
    }
  }
}

module.exports = {
  run: runLongPoll
};
