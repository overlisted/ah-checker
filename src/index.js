const fetch = require("node-fetch");
const moment = require("moment");
const longPoll = require("./longpoll");

moment.locale("ru");

const formatter = new Intl.NumberFormat("ru-RU");
const hypixelKey = "c5d85caf-8735-4978-9178-34b4786ef4c8";
const groupKey = "aa4e0ef8c7ad8f4353b7f0aecc8f7eef4fc6f9650f1e3d8770987bdd4628c3516755fc0af20b49a2c5ee0";
const apiVersion = "5.103";
const groupID = "190737605";
const adminID = 331990417;

const killMessage = encodeURI("Бот был отключен разработчиком.");

let restricedMode = false;
let motd = "Лучше забаньте мемозу <3";

async function requireVKAPI(method, args) {
  const res = await fetch(
    `https://api.vk.com/method/${method}?access_token=${groupKey}&v=${apiVersion}&${args}`,
    {method: "POST"}
  );
  const json = await res.json();

  if(json.error) throw new VKError(json.error);

  return json;
}

async function requireHypixelAPI(method, args) {
  const res = await fetch(`https://api.hypixel.net/${method}?key=${hypixelKey}&${args}`);
  return res.json();
}

async function uuidToDisplayname(uuid) {
  const json = await (await fetch(`https://api.mojang.com/user/profiles/${uuid}/names`)).json();
  return json[json.length - 1].name;
}

uuidToDisplayname("951075cc8dfb48debb4aca8c5ee6f0c6").then(console.log);

async function longPoller(res) {
  const response = await (
    await fetch(`${res.response.server}?act=a_check&key=${res.response.key}&wait=25&mode=2&ts=${res.response.ts}`)
  ).json();

  if(response.updates) response.updates.forEach(async it => {
    if(it.object.message.text === "/ah kill!" && it.object.message.from_id === adminID) {
      await requireVKAPI(
        "messages.send",
        `peer_id=${it.object.message.peer_id}&random_id=${Math.random() * 0xFFFFFFFFFF}&message=${killMessage}`
      );

      process.exit(0);
    }

    if(it.type !== "message_new" || !/^\/ah (.+)\s(\d)$/.test(it.object.message.text)) return;
    requireVKAPI(
      "messages.setActivity",
      `type=typing&peer_id=${it.object.message.peer_id}&group_id=${groupID}`
    );

    let match = /^\/ah (.+)\s(\d)$/.exec(it.object.message.text);

    const player = (await requireHypixelAPI("player", `name=${match[1]}`)).player;

    const auctions = (await requireHypixelAPI(
      "skyblock/auction",
      `profile=${(Object.keys(player.stats.SkyBlock.profiles)[match[2] - 1])}`
    )).auctions;

    const activeAuctions = await Promise.all(
      auctions
        .filter(item => item.end > new Date().getTime() || !item.claimed)
        .map(async item => {
          let bidder = await uuidToDisplayname(item.bids[item.bids.length - 1].bidder);

          console.log(bidder);

          return {
            name: item.item_name,
            endTime: item.end,
            bid: item.highest_bid_amount,
            bidder: bidder,
            startingBid: item.starting_bid,
            rarity: item.tier
          }
       }
      )
    );

    const openAuctionsText = activeAuctions.map(item => {
      const texts = [];

      texts.push(`=====< ${item.name} ${item.endTime - new Date() < 0 ? "(можно забрать!)" : ""}`);
      if(item.endTime - new Date() > 0) texts.push(`Конец: ${moment(item.endTime).fromNow()}`);
      texts.push(
        `${item.bid === 0 
          ? `Начальная ставка: ${formatter.format(item.startingBid)} койнов` 
          : `Последняя ставка: ${formatter.format(item.bid)} койнов от ${item.bidder}`
        }`
      );
      texts.push(`Редкость предмета: ${item.rarity}`);

      return texts.join("\n");
    });

    const textArr = [];
    textArr.push(`Аукционы игрока ${match[1]}:`);
    textArr.push(openAuctionsText.join('\n'));
    if(!activeAuctions.length) textArr.push("Активных аукционов нет!");

    const text = textArr.join('\n');

    try {
      requireVKAPI(
        "messages.send",
        `peer_id=${it.object.message.peer_id}&random_id=${Math.random() * 0xFFFFFFFFFF}&message=${encodeURI(text)}`
      );
    } catch(e) {
      await requireVKAPI(
        "messages.send",
        `peer_id=${it.object.message.peer_id}&random_id=${Math.random() * 0xFFFFFFFFFF}&message=${
          encodeURI("Неизвестная ошибка!\n" + e)
        }`
      );
    }
  });

  res.response.ts = response.ts;

  longPoller(res);
}

//(async () => {longPoller(await requireVKAPI("groups.getLongPollServer", `group_id=${groupID}`));})();
(async () => longPoll.run())();