"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
exports.setupWebhook = setupWebhook;
var grammy_1 = require("grammy");
var conversations_1 = require("@grammyjs/conversations");
var ethers_1 = require("ethers");
var uuid_1 = require("uuid");
var dotenv = require("dotenv");
var db_1 = require("./db");
// Load environment variables
dotenv.config();
// Initialize Ethereum provider
var provider = new ethers_1.ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID");
// Global wallets storage
var groupWallets = {};
// Initialize bot
var bot = new grammy_1.Bot(process.env.BOT_TOKEN || "");
exports.bot = bot;
// Configure session middleware
bot.use((0, grammy_1.session)({
    initial: function () { return ({
        groupWallets: {},
    }); },
}));
// Use conversations plugin
bot.use((0, conversations_1.conversations)());
// Reply middleware
bot.use(function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var originalReply;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                originalReply = ctx.reply.bind(ctx);
                ctx.reply = function (text_1) {
                    var args_1 = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args_1[_i - 1] = arguments[_i];
                    }
                    return __awaiter(void 0, __spreadArray([text_1], args_1, true), void 0, function (text, other) {
                        var _a;
                        if (other === void 0) { other = {}; }
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, originalReply(text, __assign(__assign({}, other), { reply_to_message_id: (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.message_id, allow_sending_without_reply: true }))];
                                case 1: return [2 /*return*/, _b.sent()];
                            }
                        });
                    });
                };
                return [4 /*yield*/, next()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Helper function to check admin status
function isGroupAdmin(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var chatMember, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    if (!((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || !((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id))
                        return [2 /*return*/, false];
                    return [4 /*yield*/, ctx.api.getChatMember(ctx.chat.id, ctx.from.id)];
                case 1:
                    chatMember = _c.sent();
                    return [2 /*return*/, ["creator", "administrator"].includes(chatMember.status)];
                case 2:
                    error_1 = _c.sent();
                    console.error("Error checking admin status:", error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Initialize database when bot starts
(0, db_1.initializeDB)().catch(console.error);
// helper function to check for wallet existence
function walletExists(chatId) {
    return __awaiter(this, void 0, void 0, function () {
        var dbWallet, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, db_1.getWallet)(chatId)];
                case 1:
                    dbWallet = _a.sent();
                    return [2 /*return*/, dbWallet !== null];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error checking wallet existence:", error_2);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Conversations
var createWalletConversation = (0, conversations_1.createConversation)(function (conversation, ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var wallet, walletId, newWallet, error_3;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return __generator(this, function (_m) {
        switch (_m.label) {
            case 0: return [4 /*yield*/, walletExists(((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || 0)];
            case 1:
                if (!_m.sent()) return [3 /*break*/, 3];
                return [4 /*yield*/, ctx.reply("A wallet already exists for this group!")];
            case 2:
                _m.sent();
                return [2 /*return*/];
            case 3: return [4 /*yield*/, ctx.reply("Creating a new group wallet...")];
            case 4:
                _m.sent();
                _m.label = 5;
            case 5:
                _m.trys.push([5, 8, , 10]);
                wallet = ethers_1.ethers.Wallet.createRandom().connect(provider);
                walletId = (0, uuid_1.v4)();
                // Save to database
                return [4 /*yield*/, (0, db_1.createWallet)(walletId, wallet.address, ((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id) || 0, wallet.privateKey, ((_c = wallet.mnemonic) === null || _c === void 0 ? void 0 : _c.phrase) || "", ((_d = ctx.from) === null || _d === void 0 ? void 0 : _d.id) || 0, ((_e = ctx.from) === null || _e === void 0 ? void 0 : _e.username) || ((_f = ctx.from) === null || _f === void 0 ? void 0 : _f.first_name) || "Unknown")];
            case 6:
                // Save to database
                _m.sent();
                newWallet = {
                    id: walletId,
                    chatId: ((_g = ctx.chat) === null || _g === void 0 ? void 0 : _g.id) || 0,
                    wallet: wallet,
                    admins: [((_h = ctx.from) === null || _h === void 0 ? void 0 : _h.id) || 0],
                    transactions: [],
                };
                groupWallets[newWallet.chatId] = newWallet;
                return [4 /*yield*/, ctx.reply("Wallet created successfully!\nAddress: ".concat(wallet.address, "\nAdmin: @").concat(((_j = ctx.from) === null || _j === void 0 ? void 0 : _j.username) || ((_k = ctx.from) === null || _k === void 0 ? void 0 : _k.first_name) || "Unknown", "\n      \n\u26A0\uFE0F IMPORTANT: \n- 12 Word Phrase: ").concat((_l = wallet.mnemonic) === null || _l === void 0 ? void 0 : _l.phrase, "\n- Private Key: ").concat(wallet.privateKey, "\n- NEVER share your seed phrase! It could be used to access your funds!\n- NEVER share your private key! Not your key, not your crypto!\n- Only use this in a secure environment!"))];
            case 7:
                _m.sent();
                return [3 /*break*/, 10];
            case 8:
                error_3 = _m.sent();
                console.error("Wallet creation error:", error_3);
                return [4 /*yield*/, ctx.reply("Failed to create wallet. Please try again.")];
            case 9:
                _m.sent();
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); }, "create-wallet");
var createTransactionConversation = (0, conversations_1.createConversation)(function (conversation, ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var wallet, recipientMsg, recipient, amountMsg, amount, balance, amountWei, error_4, descMsg, description, tx, transactionId, transaction, error_5;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, isGroupAdmin(ctx)];
            case 1:
                if (!!(_c.sent())) return [3 /*break*/, 3];
                return [4 /*yield*/, ctx.reply("Only group administrators can create transactions.")];
            case 2:
                _c.sent();
                return [2 /*return*/];
            case 3:
                wallet = groupWallets[((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || 0];
                if (!!wallet) return [3 /*break*/, 5];
                return [4 /*yield*/, ctx.reply("No wallet exists for this group.")];
            case 4:
                _c.sent();
                return [2 /*return*/];
            case 5: return [4 /*yield*/, ctx.reply("Enter recipient address:")];
            case 6:
                _c.sent();
                return [4 /*yield*/, conversation.wait()];
            case 7:
                recipientMsg = (_c.sent()).message;
                recipient = (recipientMsg && recipientMsg.text) || "";
                if (!!ethers_1.ethers.isAddress(recipient)) return [3 /*break*/, 9];
                return [4 /*yield*/, ctx.reply("Invalid Ethereum address. Please try again.")];
            case 8:
                _c.sent();
                return [2 /*return*/];
            case 9: return [4 /*yield*/, ctx.reply("Enter amount (in ETH):")];
            case 10:
                _c.sent();
                return [4 /*yield*/, conversation.wait()];
            case 11:
                amountMsg = (_c.sent()).message;
                amount = parseFloat((amountMsg && amountMsg.text) || "0");
                if (!(isNaN(amount) || amount <= 0)) return [3 /*break*/, 13];
                return [4 /*yield*/, ctx.reply("Invalid amount. Please enter a number greater than 0.")];
            case 12:
                _c.sent();
                return [2 /*return*/];
            case 13:
                _c.trys.push([13, 17, , 19]);
                return [4 /*yield*/, provider.getBalance(wallet.wallet.address)];
            case 14:
                balance = _c.sent();
                amountWei = ethers_1.ethers.parseEther(amount.toString());
                if (!(balance < amountWei)) return [3 /*break*/, 16];
                return [4 /*yield*/, ctx.reply("Insufficient balance for this transaction.")];
            case 15:
                _c.sent();
                return [2 /*return*/];
            case 16: return [3 /*break*/, 19];
            case 17:
                error_4 = _c.sent();
                console.error("Balance check error:", error_4);
                return [4 /*yield*/, ctx.reply("Failed to check balance. Please try again.")];
            case 18:
                _c.sent();
                return [2 /*return*/];
            case 19: return [4 /*yield*/, ctx.reply("Enter transaction description:")];
            case 20:
                _c.sent();
                return [4 /*yield*/, conversation.wait()];
            case 21:
                descMsg = (_c.sent()).message;
                description = (descMsg && descMsg.text) || "No description";
                _c.label = 22;
            case 22:
                _c.trys.push([22, 26, , 28]);
                return [4 /*yield*/, wallet.wallet.sendTransaction({
                        to: recipient,
                        value: ethers_1.ethers.parseEther(amount.toString()),
                    })];
            case 23:
                tx = _c.sent();
                transactionId = (0, uuid_1.v4)();
                // Save to database
                return [4 /*yield*/, (0, db_1.createTransaction)(transactionId, wallet.id, amount.toString(), recipient, description, tx.hash)];
            case 24:
                // Save to database
                _c.sent();
                transaction = {
                    id: transactionId,
                    amount: amount,
                    recipient: recipient,
                    description: description,
                    timestamp: Date.now(),
                    signatories: [((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id) || 0],
                    txHash: tx.hash,
                    approved: true,
                };
                wallet.transactions.push(transaction);
                return [4 /*yield*/, ctx.reply("Transaction created:\nRecipient: ".concat(recipient, "\nAmount: ").concat(amount, " ETH\nTransaction Hash: ").concat(tx.hash, "\nDescription: ").concat(description))];
            case 25:
                _c.sent();
                return [3 /*break*/, 28];
            case 26:
                error_5 = _c.sent();
                console.error("Transaction creation error:", error_5);
                return [4 /*yield*/, ctx.reply("Failed to create transaction. Please check the details.")];
            case 27:
                _c.sent();
                return [3 /*break*/, 28];
            case 28: return [2 /*return*/];
        }
    });
}); }, "create-transaction");
// Register conversations
bot.use(createWalletConversation);
bot.use(createTransactionConversation);
// Middleware for group mentions
bot.use(function (ctx, next) { return __awaiter(void 0, void 0, void 0, function () {
    var message, botUsername;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "group" || ((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.type) === "supergroup") {
                    message = ctx.message;
                    botUsername = ctx.me.username;
                    if (!((_c = message === null || message === void 0 ? void 0 : message.text) === null || _c === void 0 ? void 0 : _c.includes("@".concat(botUsername)))) {
                        return [2 /*return*/];
                    }
                }
                if (!(((_d = ctx.chat) === null || _d === void 0 ? void 0 : _d.type) === "private")) return [3 /*break*/, 2];
                return [4 /*yield*/, ctx.reply("Please add me to a group to use the Group Wallet Bot. I can only manage wallets in group chats.")];
            case 1:
                _e.sent();
                return [2 /*return*/];
            case 2: return [4 /*yield*/, next()];
            case 3:
                _e.sent();
                return [2 /*return*/];
        }
    });
}); });
// Bot commands
bot.command("start", function (ctx) {
    var _a;
    if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "private") {
        ctx.reply("Please add me to a group to use the Group Wallet Bot. I can only manage wallets in group chats.");
    }
});
bot.command("createwallet", function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, isGroupAdmin(ctx)];
            case 1:
                if (!!(_a.sent())) return [3 /*break*/, 3];
                return [4 /*yield*/, ctx.reply("Only group administrators can create wallets.")];
            case 2:
                _a.sent();
                return [2 /*return*/];
            case 3: return [4 /*yield*/, ctx.conversation.enter("create-wallet")];
            case 4:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
bot.command("createtx", function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ctx.conversation.enter("create-transaction")];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
bot.command("balance", function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var wallet, balance, error_6;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                // Check if in group
                if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "private") {
                    ctx.reply("This command can only be used in groups.");
                    return [2 /*return*/];
                }
                wallet = groupWallets[((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id) || 0];
                if (!wallet) {
                    ctx.reply("No wallet exists for this group.");
                    return [2 /*return*/];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, provider.getBalance(wallet.wallet.address)];
            case 2:
                balance = _c.sent();
                ctx.reply("Current Balance: ".concat(ethers_1.ethers.formatEther(balance), " ETH"));
                return [3 /*break*/, 4];
            case 3:
                error_6 = _c.sent();
                console.error("Balance check error:", error_6);
                ctx.reply("Unable to fetch balance. Please try again later.");
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Main error handling
bot.catch(function (err) {
    console.error("Bot error:", err);
});
// Webhook path
var WEBHOOK_PATH = "/telegram/".concat(process.env.BOT_TOKEN);
// Webhook setup function
function setupWebhook() {
    return __awaiter(this, void 0, void 0, function () {
        var webhookUrl, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, bot.api.deleteWebhook()];
                case 1:
                    _a.sent();
                    webhookUrl = "".concat(process.env.WEBHOOK_DOMAIN, "/api/bot");
                    return [4 /*yield*/, bot.api.setWebhook(webhookUrl)];
                case 2:
                    _a.sent();
                    console.log("Webhook set to: ".concat(webhookUrl));
                    return [3 /*break*/, 4];
                case 3:
                    error_7 = _a.sent();
                    console.error("Failed to set webhook:", error_7);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Initialize webhook
setupWebhook();
// bot.start();
