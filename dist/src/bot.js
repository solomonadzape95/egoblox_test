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
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const grammy_1 = require("grammy");
const conversations_1 = require("@grammyjs/conversations");
const ethers_1 = require("ethers");
const uuid_1 = require("uuid");
const dotenv = __importStar(require("dotenv"));
const db_1 = require("./db");
// Load environment variables
dotenv.config();
// Initialize Ethereum provider
const provider = new ethers_1.ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID");
// Global wallets storage
const groupWallets = {};
// Initialize bot
const bot = new grammy_1.Bot(process.env.BOT_TOKEN || "");
exports.bot = bot;
// Configure session middleware
bot.use((0, grammy_1.session)({
    initial: () => ({
        groupWallets: {},
    }),
}));
// Use conversations plugin
bot.use((0, conversations_1.conversations)());
// Reply middleware
bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const originalReply = ctx.reply.bind(ctx);
    ctx.reply = (text_1, ...args_1) => __awaiter(void 0, [text_1, ...args_1], void 0, function* (text, other = {}) {
        var _a;
        return yield originalReply(text, Object.assign(Object.assign({}, other), { reply_to_message_id: (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.message_id, allow_sending_without_reply: true }));
    });
    yield next();
}));
// Helper function to check admin status
function isGroupAdmin(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            if (!((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || !((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.id))
                return false;
            const chatMember = yield ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
            return ["creator", "administrator"].includes(chatMember.status);
        }
        catch (error) {
            console.error("Error checking admin status:", error);
            return false;
        }
    });
}
// Initialize database when bot starts
(0, db_1.initializeDB)().catch(console.error);
// helper function to check for wallet existence
function walletExists(chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const dbWallet = yield (0, db_1.getWallet)(chatId);
            return dbWallet !== null;
        }
        catch (error) {
            console.error("Error checking wallet existence:", error);
            return false;
        }
    });
}
// Conversations
const createWalletConversation = (0, conversations_1.createConversation)((conversation, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    // Check if wallet already exists
    if (yield walletExists(((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || 0)) {
        yield ctx.reply("A wallet already exists for this group!");
        return;
    }
    yield ctx.reply("Creating a new group wallet...");
    try {
        // Create Ethereum wallet
        const wallet = ethers_1.ethers.Wallet.createRandom().connect(provider);
        const walletId = (0, uuid_1.v4)();
        // Save to database
        yield (0, db_1.createWallet)(walletId, wallet.address, ((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id) || 0, wallet.privateKey, ((_c = wallet.mnemonic) === null || _c === void 0 ? void 0 : _c.phrase) || "", ((_d = ctx.from) === null || _d === void 0 ? void 0 : _d.id) || 0, ((_e = ctx.from) === null || _e === void 0 ? void 0 : _e.username) || ((_f = ctx.from) === null || _f === void 0 ? void 0 : _f.first_name) || "Unknown");
        // Save to memory
        const newWallet = {
            id: walletId,
            chatId: ((_g = ctx.chat) === null || _g === void 0 ? void 0 : _g.id) || 0,
            wallet: wallet,
            admins: [((_h = ctx.from) === null || _h === void 0 ? void 0 : _h.id) || 0],
            transactions: [],
        };
        groupWallets[newWallet.chatId] = newWallet;
        yield ctx.reply(`Wallet created successfully!
Address: ${wallet.address}
Admin: @${((_j = ctx.from) === null || _j === void 0 ? void 0 : _j.username) || ((_k = ctx.from) === null || _k === void 0 ? void 0 : _k.first_name) || "Unknown"}
      
⚠️ IMPORTANT: 
- 12 Word Phrase: ${(_l = wallet.mnemonic) === null || _l === void 0 ? void 0 : _l.phrase}
- Private Key: ${wallet.privateKey}
- NEVER share your seed phrase! It could be used to access your funds!
- NEVER share your private key! Not your key, not your crypto!
- Only use this in a secure environment!`);
    }
    catch (error) {
        console.error("Wallet creation error:", error);
        yield ctx.reply("Failed to create wallet. Please try again.");
    }
}), "create-wallet");
const createTransactionConversation = (0, conversations_1.createConversation)((conversation, ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Check if user is admin
    if (!(yield isGroupAdmin(ctx))) {
        yield ctx.reply("Only group administrators can create transactions.");
        return;
    }
    const wallet = groupWallets[((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.id) || 0];
    if (!wallet) {
        yield ctx.reply("No wallet exists for this group.");
        return;
    }
    yield ctx.reply("Enter recipient address:");
    const { message: recipientMsg } = yield conversation.wait();
    const recipient = (recipientMsg && recipientMsg.text) || "";
    // Validate recipient address
    if (!ethers_1.ethers.isAddress(recipient)) {
        yield ctx.reply("Invalid Ethereum address. Please try again.");
        return;
    }
    yield ctx.reply("Enter amount (in ETH):");
    const { message: amountMsg } = yield conversation.wait();
    const amount = parseFloat((amountMsg && amountMsg.text) || "0");
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
        yield ctx.reply("Invalid amount. Please enter a number greater than 0.");
        return;
    }
    // Check balance
    try {
        const balance = yield provider.getBalance(wallet.wallet.address);
        const amountWei = ethers_1.ethers.parseEther(amount.toString());
        if (balance < amountWei) {
            yield ctx.reply("Insufficient balance for this transaction.");
            return;
        }
    }
    catch (error) {
        console.error("Balance check error:", error);
        yield ctx.reply("Failed to check balance. Please try again.");
        return;
    }
    yield ctx.reply("Enter transaction description:");
    const { message: descMsg } = yield conversation.wait();
    const description = (descMsg && descMsg.text) || "No description";
    try {
        // Prepare transaction
        const tx = yield wallet.wallet.sendTransaction({
            to: recipient,
            value: ethers_1.ethers.parseEther(amount.toString()),
        });
        const transactionId = (0, uuid_1.v4)();
        // Save to database
        yield (0, db_1.createTransaction)(transactionId, wallet.id, amount.toString(), recipient, description, tx.hash);
        // Save to memory
        const transaction = {
            id: transactionId,
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
// Register conversations
bot.use(createWalletConversation);
bot.use(createTransactionConversation);
// Middleware for group mentions
bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "group" || ((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.type) === "supergroup") {
        const message = ctx.message;
        const botUsername = ctx.me.username;
        if (!((_c = message === null || message === void 0 ? void 0 : message.text) === null || _c === void 0 ? void 0 : _c.includes(`@${botUsername}`))) {
            return;
        }
    }
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
    var _a, _b;
    // Check if in group
    if (((_a = ctx.chat) === null || _a === void 0 ? void 0 : _a.type) === "private") {
        ctx.reply("This command can only be used in groups.");
        return;
    }
    const wallet = groupWallets[((_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id) || 0];
    if (!wallet) {
        ctx.reply("No wallet exists for this group.");
        return;
    }
    try {
        const balance = yield provider.getBalance(wallet.wallet.address);
        ctx.reply(`Current Balance: ${ethers_1.ethers.formatEther(balance)} ETH`);
    }
    catch (error) {
        console.error("Balance check error:", error);
        ctx.reply("Unable to fetch balance. Please try again later.");
    }
}));
// Main error handling
bot.catch((err) => {
    console.error("Bot error:", err);
});
