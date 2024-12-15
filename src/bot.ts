import { webhookCallback } from "grammy";
import { Bot, Context, session, SessionFlavor } from "grammy";
import {
  conversations,
  createConversation,
  ConversationFlavor,
} from "@grammyjs/conversations";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
import {
  initializeDB,
  createWallet as dbCreateWallet,
  getWallet,
  createTransaction as dbCreateTransaction,
} from "./db";
import express from "express";

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

// Initialize Ethereum provider
const provider = new ethers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_URL || "https://sepolia.infura.io/v3/YOUR-PROJECT-ID"
);

// Global wallets storage
const groupWallets: { [chatId: number]: GroupWallet } = {};

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

// Reply middleware
bot.use(async (ctx, next) => {
  const originalReply = ctx.reply.bind(ctx);
  ctx.reply = async (text: string, other: any = {}) => {
    return await originalReply(text, {
      ...other,
      reply_to_message_id: ctx.message?.message_id,
      allow_sending_without_reply: true,
    });
  };
  await next();
});

// Helper function to check admin status
async function isGroupAdmin(ctx: MyContext): Promise<boolean> {
  try {
    if (!ctx.chat?.id || !ctx.from?.id) return false;
    const chatMember = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    return ["creator", "administrator"].includes(chatMember.status);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Initialize database when bot starts
initializeDB().catch(console.error);

// helper function to check for wallet existence
async function walletExists(chatId: number): Promise<boolean> {
  try {
    const dbWallet = await getWallet(chatId);
    return dbWallet !== null;
  } catch (error) {
    console.error("Error checking wallet existence:", error);
    return false;
  }
}

// Conversations
const createWalletConversation = createConversation<MyContext>(
  async (conversation, ctx) => {
    // Check if wallet already exists
    if (await walletExists(ctx.chat?.id || 0)) {
      await ctx.reply("A wallet already exists for this group!");
      return;
    }

    await ctx.reply("Creating a new group wallet...");

    try {
      // Create Ethereum wallet
      const wallet = ethers.Wallet.createRandom().connect(provider);
      const walletId = uuidv4();

      // Save to database
      await dbCreateWallet(
        walletId,
        wallet.address,
        ctx.chat?.id || 0,
        wallet.privateKey,
        wallet.mnemonic?.phrase || "",
        ctx.from?.id || 0,
        ctx.from?.username || ctx.from?.first_name || "Unknown"
      );

      // Save to memory
      const newWallet: GroupWallet = {
        id: walletId,
        chatId: ctx.chat?.id || 0,
        wallet: wallet,
        admins: [ctx.from?.id || 0],
        transactions: [],
      };
      groupWallets[newWallet.chatId] = newWallet;

      await ctx.reply(`Wallet created successfully!
Address: ${wallet.address}
Admin: @${ctx.from?.username || ctx.from?.first_name || "Unknown"}
      
⚠️ IMPORTANT: 
- 12 Word Phrase: ${wallet.mnemonic?.phrase}
- Private Key: ${wallet.privateKey}
- NEVER share your seed phrase! It could be used to access your funds!
- NEVER share your private key! Not your key, not your crypto!
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
    // Check if user is admin
    if (!(await isGroupAdmin(ctx))) {
      await ctx.reply("Only group administrators can create transactions.");
      return;
    }

    const wallet = groupWallets[ctx.chat?.id || 0];
    if (!wallet) {
      await ctx.reply("No wallet exists for this group.");
      return;
    }

    await ctx.reply("Enter recipient address:");
    const { message: recipientMsg } = await conversation.wait();
    const recipient = (recipientMsg && recipientMsg.text) || "";

    // Validate recipient address
    if (!ethers.isAddress(recipient)) {
      await ctx.reply("Invalid Ethereum address. Please try again.");
      return;
    }

    await ctx.reply("Enter amount (in ETH):");
    const { message: amountMsg } = await conversation.wait();
    const amount = parseFloat((amountMsg && amountMsg.text) || "0");

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply("Invalid amount. Please enter a number greater than 0.");
      return;
    }

    // Check balance
    try {
      const balance = await provider.getBalance(wallet.wallet.address);
      const amountWei = ethers.parseEther(amount.toString());
      if (balance < amountWei) {
        await ctx.reply("Insufficient balance for this transaction.");
        return;
      }
    } catch (error) {
      console.error("Balance check error:", error);
      await ctx.reply("Failed to check balance. Please try again.");
      return;
    }

    await ctx.reply("Enter transaction description:");
    const { message: descMsg } = await conversation.wait();
    const description = (descMsg && descMsg.text) || "No description";

    try {
      // Prepare transaction
      const tx = await wallet.wallet.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount.toString()),
      });

      const transactionId = uuidv4();

      // Save to database
      await dbCreateTransaction(
        transactionId,
        wallet.id,
        amount.toString(),
        recipient,
        description,
        tx.hash
      );

      // Save to memory
      const transaction: Transaction = {
        id: transactionId,
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

// Register conversations
bot.use(createWalletConversation);
bot.use(createTransactionConversation);

// Middleware for group mentions
bot.use(async (ctx, next) => {
  if (ctx.chat?.type === "group" || ctx.chat?.type === "supergroup") {
    const message = ctx.message;
    const botUsername = ctx.me.username;

    if (!message?.text?.includes(`@${botUsername}`)) {
      return;
    }
  }

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
  if (!(await isGroupAdmin(ctx))) {
    await ctx.reply("Only group administrators can create wallets.");
    return;
  }
  await ctx.conversation.enter("create-wallet");
});

bot.command("createtx", async (ctx) => {
  await ctx.conversation.enter("create-transaction");
});

bot.command("balance", async (ctx) => {
  // Check if in group
  if (ctx.chat?.type === "private") {
    ctx.reply("This command can only be used in groups.");
    return;
  }

  const wallet = groupWallets[ctx.chat?.id || 0];
  if (!wallet) {
    ctx.reply("No wallet exists for this group.");
    return;
  }

  try {
    const balance = await provider.getBalance(wallet.wallet.address);
    ctx.reply(`Current Balance: ${ethers.formatEther(balance)} ETH`);
  } catch (error) {
    console.error("Balance check error:", error);
    ctx.reply("Unable to fetch balance. Please try again later.");
  }
});

// Main error handling
bot.catch((err) => {
  console.error("Bot error:", err);
});

// Webhook path
const WEBHOOK_PATH = `/telegram/${process.env.BOT_TOKEN}`;

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    try {
      await webhookCallback(bot, "express")(req, res);
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  } else {
    res.status(200).send("Bot is running");
  }
}

// Webhook setup function
export async function setupWebhook() {
  try {
    await bot.api.deleteWebhook();
    const webhookUrl = `${process.env.WEBHOOK_DOMAIN}${WEBHOOK_PATH}`;
    await bot.api.setWebhook(webhookUrl);
    console.log(`Webhook set to: ${webhookUrl}`);
  } catch (error) {
    console.error("Failed to set webhook:", error);
  }
}

// Initialize webhook
// setupWebhook();
bot.start();
