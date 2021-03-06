const util = require("./util");
const nbt = require("nbt-js");
const zlib = require("zlib");

const coinsCases = ["койн", "койна", "койнов"];

function orEmptyString(condition, string) {
  return condition ? string : "";
}

function buildAuctionsView(auctions) {
  return auctions
    .map(item => {
      const texts = [];

      texts.push(
        `=====< ${
          orEmptyString(item.count > 1, `[x${item.count}]`)
        } ${item.name} ${
          orEmptyString(item.endTime - new Date() < 0, "(можно забрать!)")
        }`);
      if (item.endTime - new Date() > 0) texts.push(`Конец: ${util.moment(item.endTime).fromNow()}`);
      texts.push(
        `${item.bid === 0
          ? `Начальная ставка: ${util.formatter.format(item.startingBid)} ${util.findDeclension(item.bid, coinsCases)}`
          : `Последняя ставка: ${util.formatter.format(item.bid)} ${util.findDeclension(item.bid, coinsCases)} от ${item.bidder}`
        }`
      );

      return texts.join("\n");
    })
    .join("\n");
}

async function buildAuctionModel(auction) {
  let lastBid = auction.bids[auction.bids.length - 1];
  // куча всего чтобы распарсить нбт предмета
  let item = nbt.read(zlib.gunzipSync(Buffer.from(auction.item_bytes.data, "base64"))).payload[""].i[0];

  return {
    name: auction.item_name,
    endTime: auction.end,
    bid: auction.highest_bid_amount,
    bidder: lastBid ? await util.uuidToDisplayname(lastBid.bidder) : undefined,
    count: item.Count,
    startingBid: auction.starting_bid,
  };
}

async function buildProfileAuctionsModel(profileId) {
  return Promise.all(
    (await util.requireHypixelAPI(
      "skyblock/auction",
      `profile=${profileId}`
    )).auctions
      .filter(item => item.end > new Date() || !item.claimed)
      .map(buildAuctionModel)
  );
}

function getSoldSum(aucs) {
  return aucs[0]
    .filter(it => it.endTime - new Date() < 0)
    .map(it => it.bid)
    .reduce((a, b) => a + b, 0);
}

const ahCommands = [
  { // /ah True_han 2
    name: "ah",
    argumentsCount: 2,
    trigger: async (args, peer) => {
      await util.setTyping(peer);

      const player = (await util.requireHypixelAPI("player", `name=${args[0]}`)).player;
      const profile = Object.values(player.stats.SkyBlock.profiles)[args[1] - 1];
      const activeAuctions = await buildProfileAuctionsModel(profile.profile_id);

      const textArr = [];
      textArr.push(`Аукционы игрока ${await util.uuidToDisplayname(player.uuid)} (${profile.cute_name}):`);
      textArr.push(`====< Всего можно забрать: ${getSoldSum(activeAuctions)}`);
      textArr.push(buildAuctionsView(activeAuctions));
      if(!activeAuctions.length) textArr.push("Активных аукционов нет!");

      util.cropLargeMessage(textArr.join("\n").split("\n")).forEach(async it => await util.sendMessage(peer, it));
    }
  },

  { // /ah True_han
    name: "ah",
    argumentsCount: 1,
    trigger: async (args, peer) => {
      await util.setTyping(peer);

      const player = (await util.requireHypixelAPI("player", `name=${args[0]}`)).player;
      const profiles = player.stats.SkyBlock.profiles;
      const activeAuctions = (await Promise.all(Object.keys(profiles).map(buildProfileAuctionsModel))).filter(it => it.length > 0);

      const textArr = [];
      textArr.push(`Аукционы игрока ${await util.uuidToDisplayname(player.uuid)}:`);
      textArr.push(`=====< Всего можно забрать: ${getSoldSum(activeAuctions)}`);
      textArr.push(activeAuctions.map(buildAuctionsView).join('\n'));
      if(!activeAuctions.length) textArr.push("Активных аукционов нет!");

      util.cropLargeMessage(textArr.join("\n").split("\n")).forEach(async it => {
        await util.sendMessage(peer, it);
        await util.sleep(1000);
      });
    }
  }
];

module.exports = {
  commands: ahCommands
};
