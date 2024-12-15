"use strict";
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
exports.initializeDB = initializeDB;
exports.createWallet = createWallet;
exports.getWallet = getWallet;
exports.getAllWallets = getAllWallets;
exports.getAdmins = getAdmins;
exports.addAdmin = addAdmin;
exports.createTransaction = createTransaction;
exports.getTransactions = getTransactions;
const postgres_1 = require("@vercel/postgres");
// Database initialization
function initializeDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create wallets table
            yield (0, postgres_1.sql) `
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        address TEXT UNIQUE NOT NULL,
        chat_id TEXT NOT NULL,
        private_key TEXT NOT NULL,
        mnemonic TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
            // Create admins table
            yield (0, postgres_1.sql) `
      CREATE TABLE IF NOT EXISTS admins (
        wallet_id TEXT REFERENCES wallets(id),
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (wallet_id, user_id)
      )
    `;
            // Create transactions table
            yield (0, postgres_1.sql) `
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        wallet_id TEXT REFERENCES wallets(id),
        amount TEXT NOT NULL,
        recipient TEXT NOT NULL,
        description TEXT,
        tx_hash TEXT,
        approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
            console.log('Database initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    });
}
// Wallet operations
function createWallet(id, address, chatId, privateKey, mnemonic, adminId, adminUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Insert wallet first
            yield (0, postgres_1.sql) `
      INSERT INTO wallets (id, address, chat_id, private_key, mnemonic)
      VALUES (${id}, ${address}, ${chatId.toString()}, ${privateKey}, ${mnemonic});
    `;
            // Then insert admin
            yield (0, postgres_1.sql) `
      INSERT INTO admins (wallet_id, user_id, username)
      VALUES (${id}, ${adminId.toString()}, ${adminUsername});
    `;
        }
        catch (error) {
            console.error('Failed to create wallet:', error);
            throw error;
        }
    });
}
function getWallet(chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, postgres_1.sql) `
      SELECT * FROM wallets WHERE chat_id = ${chatId.toString()};
    `;
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Failed to get wallet:', error);
            throw error;
        }
    });
}
function getAllWallets() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, postgres_1.sql) `
      SELECT * FROM wallets;
    `;
            return result.rows;
        }
        catch (error) {
            console.error('Failed to get all wallets:', error);
            throw error;
        }
    });
}
// Admin operations
function getAdmins(walletId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, postgres_1.sql) `
      SELECT * FROM admins WHERE wallet_id = ${walletId};
    `;
            return result.rows;
        }
        catch (error) {
            console.error('Failed to get admins:', error);
            throw error;
        }
    });
}
function addAdmin(walletId, userId, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, postgres_1.sql) `
      INSERT INTO admins (wallet_id, user_id, username)
      VALUES (${walletId}, ${userId.toString()}, ${username});
    `;
        }
        catch (error) {
            console.error('Failed to add admin:', error);
            throw error;
        }
    });
}
// Transaction operations
function createTransaction(id, walletId, amount, recipient, description, txHash) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, postgres_1.sql) `
      INSERT INTO transactions (id, wallet_id, amount, recipient, description, tx_hash, approved)
      VALUES (${id}, ${walletId}, ${amount}, ${recipient}, ${description}, ${txHash}, true);
    `;
        }
        catch (error) {
            console.error('Failed to create transaction:', error);
            throw error;
        }
    });
}
function getTransactions(walletId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, postgres_1.sql) `
      SELECT * FROM transactions 
      WHERE wallet_id = ${walletId}
      ORDER BY created_at DESC;
    `;
            return result.rows;
        }
        catch (error) {
            console.error('Failed to get transactions:', error);
            throw error;
        }
    });
}
