const util = require("./util");

const coinsDeclensions = ["койн", "койна", "койнов"];

function buildAuctionsView(auctions) {
  return auctions
    .map(item => {
      const texts = [];

      texts.push(`=====< ${item.name} ${item.endTime - new Date() < 0 ? "(можно забрать!)" : ""}`);
      if (item.endTime - new Date() > 0) texts.push(`Конец: ${util.moment(item.endTime).fromNow()}`);
      texts.push(
        `${item.bid === 0
          ? `Начальная ставка: ${util.formatter.format(item.startingBid)} ${util.findDeclension(item.bid, coinsDeclensions)}`
          : `Последняя ставка: ${util.formatter.format(item.bid)} ${util.findDeclension(item.bid, coinsDeclensions)} от ${item.bidder}`
        }`
      );
      texts.push(`Редкость предмета: ${item.rarity}`);

      return texts.join("\n");
    })
    .join("\n");
}

async function buildAuctionModel(auction) {
  let lastBid = auction.bids[auction.bids.length - 1];
  return {
    name: auction.item_name,
    endTime: auction.end,
    bid: auction.highest_bid_amount,
    bidder: lastBid ? await util.uuidToDisplayname(lastBid.bidder) : undefined,
    startingBid: auction.starting_bid,
    rarity: auction.tier
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

const linesUntilNewMessage = 20;
function cropLargeMessage(lines) {
  const messages = [];

  for(let i = 0; i < lines.length; i += linesUntilNewMessage) {
    messages.push(lines.filter((it, index) => index >= i && index < i + linesUntilNewMessage).join("\n"))
  }

  return messages;
}



const ahCommands = [
  { // /ah True_han 2
    name: "ah",
    argumentsCount: 2,
    trigger: async (args, peer) => {
      await util.setTyping();

      const player = (await util.requireHypixelAPI("player", `name=${args[0]}`)).player;
      const profile = Object.values(player.stats.SkyBlock.profiles)[args[1] - 1];
      const activeAuctions = await buildProfileAuctionsModel(profile.profile_id);

      const textArr = [];
      textArr.push(`Аукционы игрока ${await util.uuidToDisplayname(player.uuid)} (${profile.cute_name}):`);
      textArr.push(buildAuctionsView(activeAuctions));
      if(!activeAuctions.length) textArr.push("Активных аукционов нет!");

      cropLargeMessage(textArr.join("\n").split("\n")).forEach(async it => await util.sendMessage(peer, it));
    }
  },

  { // /ah True_han
    name: "ah",
    argumentsCount: 1,
    trigger: async (args, peer) => {
      await util.setTyping();

      const player = (await util.requireHypixelAPI("player", `name=${args[0]}`)).player;
      const profiles = player.stats.SkyBlock.profiles;
      const activeAuctions = (await Promise.all(Object.keys(profiles).map(buildProfileAuctionsModel))).filter(it => it.length > 0);

      const textArr = [];
      textArr.push(`Аукционы игрока ${await util.uuidToDisplayname(player.uuid)}:`);
      textArr.push(activeAuctions.map(buildAuctionsView).join('\n'));
      if(!activeAuctions.length) textArr.push("Активных аукционов нет!");

      cropLargeMessage(textArr.join("\n").split("\n")).forEach(async it => await util.sendMessage(peer, it));
    }
  }
];

module.exports = {
  commands: ahCommands
};