const util = require("./util");
const options = require("./options");
const auctions = require("./auctions");

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
    if(it.name !== command.name) return;
    if(it.forAdmins && message.from_id !== util.adminID) return;

    if(it.argumentsCount === command.argumentsCount) {
      it.trigger(args, message.peer_id);
    } else if(command.argumentsCount > 0 && it.argumentsCount === Infinity) {
      it.trigger(groups[2], message.peer_id);
    }
  })
}

const commands = [
  { // /ahkill!
    name: "ahkill!",
    argumentsCount: 0,
    forAdmins: true,
    trigger: async (args, peer) => {
      await util.setTyping(peer);
      await util.sendMessage(peer, "Бот был отключен разработчиком.");
      process.exit();
    }
  },

  { // eval 1 + 3
    name: "eval",
    argumentsCount: Infinity,
    forAdmins: true,
    trigger: async (args, peer) => {
      await util.setTyping(peer);
      util.sendMessage(peer, `> ${eval(args)}`)
    }
  },

  { // /options restricted
    name: "options",
    argumentsCount: 1,
    forAdmins: true,
    trigger: async (args, peer) => {
      await util.setTyping(peer);
      util.sendMessage(peer, `Настройка ${args[0]}: ${options[args[0]]}`)
    }
  },

  { // /options restricted = true
    name: "options",
    argumentsCount: 3,
    forAdmins: true,
    trigger: async (args, peer) => {
      if(args[1] === "=") {
        await util.setTyping(peer);
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

  auctions.commands[0], // /ah true_han 2
  auctions.commands[1] // /ah true_han
];

module.exports = {
  find: findCommand
};