import express from "express";
import { webhookCallback } from "grammy";
import { Bot, Context, session, SessionFlavor } from "grammy";
import {
  conversations,
  createConversation,
  ConversationFlavor,
} from "@grammyjs/conversations";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import https from "https";
import fs from "fs";
import * as dotenv from "dotenv";
import { PrismaClient } from '.prisma/client';

// Load environment variables
dotenv.config();

// Wallet interface
interface GroupWallet {
  id: string;
  chatId: number;
  wallet: ethers.HDNodeWallet;
  admins: number[];
  transactions: Transaction[];
}

// Transaction interface
interface Transaction {
  id: string;
  amount: number;
  recipient: string;
  description: string;
  timestamp: number;
  signatories: number[];
  txHash?: string;
  approved: boolean;
}

// Extended context with session and conversation support
type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

// Session data structure
interface SessionData {
  groupWallets: { [chatId: number]: GroupWallet };
}
// Initialize Ethereum provider (use Sepolia testnet as default)
const provider = new ethers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID"
);

// Initialize bot
const bot = new Bot<MyContext>(process.env.BOT_TOKEN || "");

// Configure session middleware
bot.use(
  session({
    initial: () => ({
      groupWallets: {},
    }),
  })
);

// Use conversations plugin
bot.use(conversations());

// Add the reply middleware here
bot.use(async (ctx, next) => {
  const originalReply = ctx.reply.bind(ctx);
  ctx.reply = async (text: string, other: any = {}) => {
    return await originalReply(text, {
      ...other,
      reply_to_message_id: ctx.message?.message_id,
      allow_sending_without_reply: true
    });
  };
  await next();
});

// First define conversations
const createWalletConversation = createConversation<MyContext>(
  async (conversation, ctx) => {
    await ctx.reply("Creating a new group wallet...");

    try {
      // Create Ethereum wallet
      const wallet = ethers.Wallet.createRandom().connect(provider);

      const newWallet: GroupWallet = {
        id: uuidv4(),
        chatId: ctx.chat?.id || 0,
        wallet: wallet,
        admins: [ctx.from?.id || 0],
        transactions: [],
      };

      // Save wallet to session
      ctx.session.groupWallets[newWallet.chatId] = newWallet;

      await ctx.reply(`Wallet created successfully!
Address: ${wallet.address}
Admins: ${newWallet.admins.join(", ")}
      
⚠️ IMPORTANT: 
- Private Key: ${wallet.privateKey}
- NEVER share your private key!
- Only use this in a secure environment!`);
    } catch (error) {
      console.error("Wallet creation error:", error);
      await ctx.reply("Failed to create wallet. Please try again.");
    }
  },
  "create-wallet"
);

const createTransactionConversation = createConversation<MyContext>(
  async (conversation, ctx) => {
    const wallet = ctx.session.groupWallets[ctx.chat?.id || 0];

    if (!wallet) {
      await ctx.reply("No wallet exists for this group.");
      return;
    }

    await ctx.reply("Enter recipient address:");
    const { message: recipientMsg } = await conversation.wait();
    const recipient = (recipientMsg && recipientMsg.text) || "";

    await ctx.reply("Enter amount (in ETH):");
    const { message: amountMsg } = await conversation.wait();
    const amount = parseFloat((amountMsg && amountMsg.text) || "0");

    await ctx.reply("Enter transaction description:");
    const { message: descMsg } = await conversation.wait();
    const description = (descMsg && descMsg.text) || "No description";

    try {
      // Prepare transaction
      const tx = await wallet.wallet.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount.toString()),
      });

      const transaction: Transaction = {
        id: uuidv4(),
        amount,
        recipient,
        description,
        timestamp: Date.now(),
        signatories: [ctx.from?.id || 0],
        txHash: tx.hash,
        approved: true,
      };

      wallet.transactions.push(transaction);

      await ctx.reply(`Transaction created:
Recipient: ${recipient}
Amount: ${amount} ETH
Transaction Hash: ${tx.hash}
Description: ${description}`);
    } catch (error) {
      console.error("Transaction creation error:", error);
      await ctx.reply(
        "Failed to create transaction. Please check the details."
      );
    }
  },
  "create-transaction"
);

// Then register them
bot.use(createWalletConversation);
bot.use(createTransactionConversation);

// Middleware to only respond to mentions in groups
bot.use(async (ctx, next) => {
  // Check if the bot is in a group and not directly mentioned
  if (ctx.chat?.type === "group" || ctx.chat?.type === "supergroup") {
    const message = ctx.message;
    const botUsername = ctx.me.username;

    // Only proceed if the bot is mentioned
    if (!message?.text?.includes(`@${botUsername}`)) {
      return;
    }
  }

  // Handle direct messages
  if (ctx.chat?.type === "private") {
    await ctx.reply(
      "Please add me to a group to use the Group Wallet Bot. I can only manage wallets in group chats."
    );
    return;
  }

  await next();
});

// Bot commands
bot.command("start", (ctx) => {
  if (ctx.chat?.type === "private") {
    ctx.reply(
      "Please add me to a group to use the Group Wallet Bot. I can only manage wallets in group chats."
    );
  }
});

bot.command("createwallet", async (ctx) => {
  // Check if user is admin
  if (!await isGroupAdmin(ctx)) {
    await ctx.reply("Only group administrators can create wallets.");
    return;
  }
  
  await ctx.conversation.enter("create-wallet");
});

bot.command("createtx", async (ctx) => {
  await ctx.conversation.enter("create-transaction");
});

bot.command("balance", async (ctx) => {
  const wallet = ctx.session.groupWallets[ctx.chat?.id || 0];
  if (wallet) {
    try {
      const balance = await provider.getBalance(wallet.wallet.address);
      ctx.reply(`Current Balance: ${ethers.formatEther(balance)} ETH`);
    } catch (error) {
      ctx.reply("Unable to fetch balance.");
    }
  } else {
    ctx.reply("No wallet exists for this group.");
  }
});

// Main error handling
bot.catch((err) => {
  console.error("Bot error:", err);
});

// Webhook Server Configuration
const app = express();

// Webhook path (should be a secret, hard to guess URL)
const WEBHOOK_PATH = `/telegram/${process.env.BOT_TOKEN}`;

// Webhook handler
app.use(express.json());
app.use(webhookCallback(bot, "express"));

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Bot is running");
});

// Determine app port
const PORT = process.env.PORT || 3000;

// SSL Options (for production)
const sslOptions =
  process.env.NODE_ENV === "production"
    ? {
        key: fs.readFileSync("/path/to/privkey.pem"),
        cert: fs.readFileSync("/path/to/fullchain.pem"),
      }
    : null;

// Initialize Prisma
const prisma = new PrismaClient();

// Add this after initializing the bot
const groupWallets: { [chatId: number]: GroupWallet } = {};

// Then modify loadWalletsFromDB to use this object instead of bot.session
async function loadWalletsFromDB() {
  try {
    const dbWallets = await prisma.wallet.findMany({
      include: {
        admins: true,
        transactions: true
      }
    });
    for (const dbWallet of dbWallets) {
      const wallet = ethers.HDNodeWallet.fromPhrase(dbWallet.mnemonic).connect(provider);
      
      groupWallets[Number(dbWallet.chatId)] = {
        id: dbWallet.id,
        chatId: Number(dbWallet.chatId),
        wallet: wallet,
        admins: dbWallet.admins.map((admin: { id: BigInt }) => Number(admin.id)),
        transactions: dbWallet.transactions.map((tx: {
          id: string;
          amount: number;
          recipient: string;
          description: string;
          timestamp: Date;
          signatories: BigInt[];
          txHash: string | null;
          approved: boolean;
        }) => ({
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
  } catch (error) {
    console.error("Error loading wallets from DB:", error);
  }
}

// Modify startServer to call loadWalletsFromDB
function startServer() {
  loadWalletsFromDB().then(() => {
    if (sslOptions) {
      https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`HTTPS Server running on port ${PORT}`);
        setWebhook();
      });
    } else {
      app.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
        setWebhook();
      });
    }
  });
}

// Set webhook method
async function setWebhook() {
  try {
    const webhookUrl = `${process.env.WEBHOOK_DOMAIN}${WEBHOOK_PATH}`;
    await bot.api.setWebhook(webhookUrl, {
      drop_pending_updates: true,
    });
    console.log(`Webhook set to: ${webhookUrl}`);
  } catch (error) {
    console.error("Failed to set webhook:", error);
  }
}

// Start the server
startServer();

export default app;

// helper function to check if user is an admin
async function isGroupAdmin(ctx: MyContext): Promise<boolean> {
  try {
    if (!ctx.chat?.id || !ctx.from?.id) return false;
    
    const chatMember = await ctx.api.getChatMember(
      ctx.chat.id,
      ctx.from.id
    );
    
    return ['creator', 'administrator'].includes(chatMember.status);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
