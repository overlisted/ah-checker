const util = require("./util");
const commands = require("./commands");

async function longPollWorker(response) {
  response.updates.forEach(async it => {
    if(it.type === "message_new") commands.find(it.object.message);
  })
}

async function runLongPoll() {
  const longPoll = (await util.requireVKAPI("groups.getLongPollServer", `group_id=${util.groupID}`)).response;

  while(true) {
    const response = await util.fetchJSON(
      `${longPoll.server}?act=a_check&key=${longPoll.key}&wait=25&mode=2&ts=${longPoll.ts}`
    );

    if(response.updates) await longPollWorker(response);

    longPoll.ts = response.ts;
  }
}

module.exports = {
  run: runLongPoll
};

