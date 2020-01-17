const util = require("./util");
const options = require("./options");

const commandRegex = /\/([^ ]+)( .+)*/;
function findCommand(message) {
  if(!commandRegex.test(message.text)) return;
  if(options.restricted === "true" && message.from_id !== util.adminID) return;
  const groups = commandRegex.exec(message.text);

  const args = groups[2] ? groups[2].split(" ") : [];
  args.shift(); // регекс инвалид

  const command = {
    name: groups[1],
    argumentsCount: args.length
  };

  commands.forEach(it => {
    if(it.name === command.name && it.argumentsCount === command.argumentsCount) {
      if(it.forAdmins && message.from_id !== util.adminID) return;
      it.trigger(args, message.peer_id);
    } else if(it.name === command.name & command.argumentsCount > 0 && it.argumentsCount === Infinity) {
      if(it.forAdmins && message.from_id !== util.adminID) return;
      it.trigger(groups[2], message.peer_id);
    }
  })
}

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

const commands = [
  { // /ahkill!
    name: "ahkill!",
    argumentsCount: 0,
    forAdmins: true,
    trigger: async (args, peer) => {
      await util.sendMessage(peer, "Бот был отключен разработчиком.");
      process.exit();
    }
  },

  { // eval 1 + 3
    name: "eval",
    argumentsCount: Infinity,
    forAdmins: true,
    trigger: (args, peer) => {
      util.sendMessage(peer, `> ${eval(args)}`)
    }
  },

  { // /options restricted
    name: "options",
    argumentsCount: 1,
    forAdmins: true,
    trigger: (args, peer) => {
      util.sendMessage(peer, `Настройка ${args[0]}: ${options[args[0]]}`)
    }
  },

  { // /options restricted = true
    name: "options",
    argumentsCount: 3,
    forAdmins: true,
    trigger: (args, peer) => {
      if(args[1] === "=") {
        const prev = options[args[0]];

        options[args[0]] = args[2];
        options.save();

        util.sendMessage(
          peer,
          `Разработчик установил настройку ${args[0]} на ${args[2]} (старая настройка - ${prev})`
        );
      }
    }
  },

  { // /ah True_han 2
    name: "ah",
    argumentsCount: 2,
    trigger: async (args, peer) => {
      await util.setTyping();

      const player = (await util.requireHypixelAPI("player", `name=${args[0]}`)).player;
      const profile = Object.values(player.stats.SkyBlock.profiles)[args[1] - 1];

      const activeAuctions = await Promise.all(
        (await util.requireHypixelAPI(
          "skyblock/auction",
          `profile=${profile.profile_id}`
        )).auctions
          .filter(item => item.end > new Date() || !item.claimed)
          .map(buildAuctionModel)
      );

      const openAuctionsText = buildAuctionsView(activeAuctions);

      const textArr = [];
      textArr.push(`Аукционы игрока ${await util.uuidToDisplayname(player.uuid)} (${profile.cute_name}):`);
      textArr.push(openAuctionsText);
      if(!activeAuctions.length) textArr.push("Активных аукционов нет!");

      util.sendMessage(peer, textArr.join('\n'));
    }
  },

  { // /ah True_han
    name: "ah",
    argumentsCount: 1,
    trigger: async (args, peer) => {
      await util.setTyping();

      const player = (await util.requireHypixelAPI("player", `name=${args[0]}`)).player;
      const profiles = player.stats.SkyBlock.profiles;

      const activeAuctions = (await Promise.all(
        Object.keys(profiles).map(async profile => {
          return await Promise.all(
            (await util.requireHypixelAPI(
              "skyblock/auction",
              `profile=${profile}`
            )).auctions
              .filter(item => item.end > new Date() || !item.claimed)
              .map(buildAuctionModel)
          )
        })
      )).filter(it => it.length > 0);

      const openAuctionsText = activeAuctions.map(buildAuctionsView);

      const textArr = [];
      // костыль чтобы добавить большие буквы
      textArr.push(`Аукционы игрока ${await util.uuidToDisplayname(player.uuid)}:`);
      textArr.push(openAuctionsText.join('\n'));
      if(!activeAuctions.length) textArr.push("Активных аукционов нет!");

      const messages = [];
      const lines = textArr.join("\n").split("\n");
      const linesCount = lines.length;

      for(let i = 0; i < linesCount; i += 20) {
        messages.push(lines.filter((it, index) => index >= i && index < i + 20).join("\n"))
      }

      messages.forEach(async it => await util.sendMessage(peer, it));
    }
  },
];

module.exports = {
  find: findCommand
};