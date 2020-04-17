const fs = require("fs");

const path = "options.json";

class Options {
  restricted = "false";
  apiVersion = "5.103";
  locale = "ru-RU";

  save() {
    fs.writeFileSync(path, JSON.stringify(this, null, 2))
  }
}

let options;
if(fs.existsSync(path)) {
  options = JSON.parse(fs.readFileSync(path));
  options.save = () => fs.writeFileSync(path, JSON.stringify(this, null, 2));
} else {
  options = new Options();
  options.save();
}

module.exports = options;