const fetch = require("node-fetch");
const moment = require("moment");
const options = require("./options");

moment.locale(options.locale);

const formatter = new Intl.NumberFormat(options.locale);
const adminID = "ENTER_YOUR_VK_ID_HERE";
const hypixelKey = "ENTER_YOUR_HYPIXEL_TOKEN_HERE";
const groupKey = "ENTER_YOUR_VK_GROUP_TOKEN_HERE";
const groupID = "ENTER_YOUR_VK_GROUP_ID_HERE";

async function fetchJSON(uri) {
  return (await fetch(uri)).json();
}

async function requireVKAPI(method, args) {
  const res = await fetch(
    `https://api.vk.com/method/${method}?access_token=${groupKey}&v=${options.apiVersion}&${args}`,
    {method: "POST"}
  );

  return await res.json();
}

async function sendMessage(peer, text) {
  return requireVKAPI(
    "messages.send",
    `peer_id=${peer}&random_id=${Math.random() * 0xFFFFFFFFFF}&message=${encodeURI(text)}`
  )
}

async function setTyping(peer) {
  requireVKAPI(
    "messages.setActivity",
    `type=typing&peer_id=${peer}`
  );
}

async function requireHypixelAPI(method, args) {
  return await fetchJSON(`https://api.hypixel.net/${method}?key=${hypixelKey}&${args}`);
}

async function uuidToDisplayname(uuid) {
  const json = await fetchJSON(`https://api.mojang.com/user/profiles/${uuid}/names`);
  return json[json.length - 1].name;
}

const linesUntilNewMessage = 20;
function cropLargeMessage(lines) {
  const messages = [];

  for(let i = 0; i < lines.length; i += linesUntilNewMessage) {
    messages.push(lines.filter((it, index) => index >= i && index < i + linesUntilNewMessage).join("\n"))
  }

  return messages;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findDeclension(number, cases) {
  number = Math.abs(number) % 100;
  const n = number % 10;
  if (number > 10 && number < 20) return cases[2];
  if (n > 1 && n < 5) return cases[1];
  if (n === 1) return cases[0];
  return cases[2];
}

module.exports = {
  formatter: formatter,
  moment: moment,

  adminID: adminID,
  groupID: groupID,

  cropLargeMessage: cropLargeMessage,
  findDeclension: findDeclension,
  fetchJSON: fetchJSON,
  setTyping: setTyping,
  requireVKAPI: requireVKAPI,
  requireHypixelAPI: requireHypixelAPI,
  uuidToDisplayname: uuidToDisplayname,
  sendMessage: sendMessage,
  sleep: sleep
};
