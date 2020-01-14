const fetch = require("node-fetch");
const moment = require("moment");

moment.locale("ru");

const hypixelKey = "c5d85caf-8735-4978-9178-34b4786ef4c8";
const groupKey = "aa4e0ef8c7ad8f4353b7f0aecc8f7eef4fc6f9650f1e3d8770987bdd4628c3516755fc0af20b49a2c5ee0";
const apiVersion = "5.103";
const groupID = 190737605;

async function fetchJSON(uri) {
  return (await fetch(uri)).json();
}

async function requireVKAPI(method, args) {
  const res = await fetch(
    `https://api.vk.com/method/${method}?access_token=${groupKey}&v=${apiVersion}&${args}`,
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
    `type=typing&peer_id=${peer}&group_id=${groupID}`
  );
}

async function requireHypixelAPI(method, args) {
  return await fetchJSON(`https://api.hypixel.net/${method}?key=${hypixelKey}&${args}`);
}

async function requireSlothpixel(method, args) {
  return await fetchJSON(`https://api.slothpixel.me/${method}&${args}`);
}

async function uuidToDisplayname(uuid) {
  const json = await fetchJSON(`https://api.mojang.com/user/profiles/${uuid}/names`);
  return json[json.length - 1].name;
}

module.exports = {
  formatter: new Intl.NumberFormat("ru-RU"),
  moment: moment,

  adminID: 331990417,
  groupID: groupID,

  fetchJSON: fetchJSON,
  setTyping: setTyping,
  requireVKAPI: requireVKAPI,
  requireHypixelAPI: requireHypixelAPI,
  uuidToDisplayname: uuidToDisplayname,
  sendMessage: sendMessage
};