const path = require('path');

const BingParser = require('./core/BingParser');
const Storage = require('./core/Storage');

const Archiver = require('./core/Archiver');

const config = require('./config');

const bingParser = new BingParser(config.dataURL);
const storage = new Storage(path.join(__dirname, config.dbFile));

const archiver = new Archiver(bingParser, storage);

setInterval(() => archiver.run(), 60 * 60 * 1000);
archiver.run();