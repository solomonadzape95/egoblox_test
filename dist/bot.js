"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const grammy_1 = require("grammy");
const grammy_2 = require("grammy");
const conversations_1 = require("@grammyjs/conversations");
const ethers_1 = require("ethers");
const uuid_1 = require("uuid");
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const dotenv = __importStar(require("dotenv"));
const client_1 = require(".prisma/client");
// Load environment variables
dotenv.config();
// Initialize Ethereum provider (use Sepolia testnet as default)
const provider = new ethers_1.ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID");
// Initialize bot
const bot = new grammy_2.Bot(process.env.BOT_TOKEN || "");
// Configure session middleware
bot.use((0, grammy_2.session)({
    initial: () => ({
        groupWallets: {},
    }),
}));
// Use conversations plugin
bot.use((0, conversations_1.conversations)());
// Add the reply middleware here
bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const originalReply = ctx.reply.bind(ctx);
    ctx.reply = (text_1, ...args_1) => __awaiter(void 0, [text_1, ...args_1], void 0, function* (text, other = {}) {
        var _a;
        return yield originalReply(text, Object.assign(Object.assign({}, other), { reply_to_message_id: (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.message_id, allow_sending_without_reply: true }));
    });
    yield next();
}));
// First define conversations
const createWalletConversation = (0, conversations_1.createConversation)((conversation, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield ctx.reply("Creating a new group wallet...");
    try {
        // Create Ethereum wallet
        const wallet = ethers_1.ethers.Wallet.createRandom().connect(provider);
        const newWallet = {
            id: (0, uuid_1.v4)(),
            chatId: ((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || 0,
            wallet: wallet,
            admins: [((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id) || 0],
            transactions: [],
        };
        // Save wallet to session
        ctx.session.groupWallets[newWallet.chatId] = newWallet;
        yield ctx.reply(`Wallet created successfully!
Address: ${wallet.address}
Admins: ${newWallet.admins.join(", ")}
      
⚠️ IMPORTANT: 
- Private Key: ${wallet.privateKey}
- NEVER share your private key!
- Only use this in a secure environment!`);
    }
    catch (error) {
        console.error("Wallet creation error:", error);
        yield ctx.reply("Failed to create wallet. Please try again.");
    }
}), "create-wallet");
const createTransactionConversation = (0, conversations_1.createConversation)((conversation, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const wallet = ctx.session.groupWallets[((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || 0];
    if (!wallet) {
        yield ctx.reply("No wallet exists for this group.");
        return;
    }
    yield ctx.reply("Enter recipient address:");
    const { message: recipientMsg } = yield conversation.wait();
    const recipient = (recipientMsg && recipientMsg.text) || "";
    yield ctx.reply("Enter amount (in ETH):");
    const { message: amountMsg } = yield conversation.wait();
    const amount = parseFloat((amountMsg && amountMsg.text) || "0");
    yield ctx.reply("Enter transaction description:");
    const { message: descMsg } = yield conversation.wait();
    const description = (descMsg && descMsg.text) || "No description";
    try {
        // Prepare transaction
        const tx = yield wallet.wallet.sendTransaction({
            to: recipient,
            value: ethers_1.ethers.parseEther(amount.toString()),
        });
        const transaction = {
            id: (0, uuid_1.v4)(),
            amount,
            recipient,
            description,
            timestamp: Date.now(),
            signatories: [((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id) || 0],
            txHash: tx.hash,
            approved: true,
        };
        wallet.transactions.push(transaction);
        yield ctx.reply(`Transaction created:
Recipient: ${recipient}
Amount: ${amount} ETH
Transaction Hash: ${tx.hash}
Description: ${description}`);
    }
    catch (error) {
        console.error("Transaction creation error:", error);
        yield ctx.reply("Failed to create transaction. Please check the details.");
    }
}), "create-transaction");
// Then register them
bot.use(createWalletConversation);
bot.use(createTransactionConversation);
// Middleware to only respond to mentions in groups
bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // Check if the bot is in a group and not directly mentioned
    if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "group" || ((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.type) === "supergroup") {
        const message = ctx.message;
        const botUsername = ctx.me.username;
        // Only proceed if the bot is mentioned
        if (!((_c = message === null || message === void 0 ? void 0 : message.text) === null || _c === void 0 ? void 0 : _c.includes(`@${botUsername}`))) {
            return;
        }
    }
    // Handle direct messages
    if (((_d = ctx.chat) === null || _d === void 0 ? void 0 : _d.type) === "private") {
        yield ctx.reply("Please add me to a group to use the Group Wallet Bot. I can only manage wallets in group chats.");
        return;
    }
    yield next();
}));
// Bot commands
bot.command("start", (ctx) => {
    var _a;
    if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "private") {
        ctx.reply("Please add me to a group to use the Group Wallet Bot. I can only manage wallets in group chats.");
    }
});
bot.command("createwallet", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user is admin
    if (!(yield isGroupAdmin(ctx))) {
        yield ctx.reply("Only group administrators can create wallets.");
        return;
    }
    yield ctx.conversation.enter("create-wallet");
}));
bot.command("createtx", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.conversation.enter("create-transaction");
}));
bot.command("balance", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const wallet = ctx.session.groupWallets[((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || 0];
    if (wallet) {
        try {
            const balance = yield provider.getBalance(wallet.wallet.address);
            ctx.reply(`Current Balance: ${ethers_1.ethers.formatEther(balance)} ETH`);
        }
        catch (error) {
            ctx.reply("Unable to fetch balance.");
        }
    }
    else {
        ctx.reply("No wallet exists for this group.");
    }
}));
// Main error handling
bot.catch((err) => {
    console.error("Bot error:", err);
});
// Webhook Server Configuration
const app = (0, express_1.default)();
// Webhook path (should be a secret, hard to guess URL)
const WEBHOOK_PATH = `/telegram/${process.env.BOT_TOKEN}`;
// Webhook handler
app.use(express_1.default.json());
app.use((0, grammy_1.webhookCallback)(bot, "express"));
// Health check endpoint
app.get("/", (req, res) => {
    res.send("Bot is running");
});
// Determine app port
const PORT = process.env.PORT || 3000;
// SSL Options (for production)
const sslOptions = process.env.NODE_ENV === "production"
    ? {
        key: fs_1.default.readFileSync("/path/to/privkey.pem"),
        cert: fs_1.default.readFileSync("/path/to/fullchain.pem"),
    }
    : null;
// Initialize Prisma
const prisma = new client_1.PrismaClient();
// Add this after initializing the bot
const groupWallets = {};
// Then modify loadWalletsFromDB to use this object instead of bot.session
function loadWalletsFromDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const dbWallets = yield prisma.wallet.findMany({
                include: {
                    admins: true,
                    transactions: true
                }
            });
            for (const dbWallet of dbWallets) {
                const wallet = ethers_1.ethers.HDNodeWallet.fromPhrase(dbWallet.mnemonic).connect(provider);
                groupWallets[Number(dbWallet.chatId)] = {
                    id: dbWallet.id,
                    chatId: Number(dbWallet.chatId),
                    wallet: wallet,
                    admins: dbWallet.admins.map((admin) => Number(admin.id)),
                    transactions: dbWallet.transactions.map((tx) => ({
                        id: tx.id,
                        amount: tx.amount,
                        recipient: tx.recipient,
                        description: tx.description,
                        timestamp: tx.timestamp.getTime(),
                        signatories: tx.signatories.map(Number),
                        txHash: tx.txHash || undefined,
                        approved: tx.approved
                    }))
                };
            }
        }
        catch (error) {
            console.error("Error loading wallets from DB:", error);
        }
    });
}
// Modify startServer to call loadWalletsFromDB
function startServer() {
    loadWalletsFromDB().then(() => {
        if (sslOptions) {
            https_1.default.createServer(sslOptions, app).listen(PORT, () => {
                console.log(`HTTPS Server running on port ${PORT}`);
                setWebhook();
            });
        }
        else {
            app.listen(PORT, () => {
                console.log(`HTTP Server running on port ${PORT}`);
                setWebhook();
            });
        }
    });
}
// Set webhook method
function setWebhook() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const webhookUrl = `${process.env.WEBHOOK_DOMAIN}${WEBHOOK_PATH}`;
            yield bot.api.setWebhook(webhookUrl, {
                drop_pending_updates: true,
            });
            console.log(`Webhook set to: ${webhookUrl}`);
        }
        catch (error) {
            console.error("Failed to set webhook:", error);
        }
    });
}
// Start the server
startServer();
exports.default = app;
// helper function to check if user is an admin
function isGroupAdmin(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            if (!((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || !((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id))
                return false;
            const chatMember = yield ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
            return ['creator', 'administrator'].includes(chatMember.status);
        }
        catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    });
}
