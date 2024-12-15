"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const bot_1 = require("../src/bot");
const grammy_1 = require("grammy");
exports.config = {
    runtime: 'edge',
    maxDuration: 9000,
};
exports.default = (0, grammy_1.webhookCallback)(bot_1.bot, "std/http");
