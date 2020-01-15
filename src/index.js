const longPoll = require("./longpoll");

(async () =>{
  while(true) await longPoll.run();
})();