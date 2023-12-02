#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const parse_save_1 = require("../parse-save");
const main = async () => {
    const saveFile = process.argv[2];
    const saveFilePath = (0, node_path_1.join)(process.cwd(), saveFile);
    const data = await (0, promises_1.readFile)(saveFilePath);
    (0, node_fs_1.writeFileSync)(saveFilePath + '.json', JSON.stringify((0, parse_save_1.getSaveInfo)(data), null, 2));
    console.log('Wrote file to ' + saveFilePath + '.json');
};
exports.main = main;
void (0, exports.main)();
//# sourceMappingURL=xcom-save-parser.js.map