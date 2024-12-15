import { sql } from '@vercel/postgres';
import { ethers } from "ethers";

// Types
interface DBWallet {
  id: string;
  address: string;
  chat_id: string;
  private_key: string;
  mnemonic: string;
  created_at: Date;
}

interface DBAdmin {
  wallet_id: string;
  user_id: string;
  username: string;
  added_at: Date;
}

interface DBTransaction {
  id: string;
  wallet_id: string;
  amount: string;
  recipient: string;
  description: string;
  tx_hash: string | null;
  approved: boolean;
  created_at: Date;
}

// Database initialization
export async function initializeDB() {
  try {
    // Create wallets table
    await sql`
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
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        wallet_id TEXT REFERENCES wallets(id),
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (wallet_id, user_id)
      )
    `;

    // Create transactions table
    await sql`
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
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Wallet operations
export async function createWallet(
  id: string,
  address: string,
  chatId: number,
  privateKey: string,
  mnemonic: string,
  adminId: number,
  adminUsername: string
): Promise<void> {
  try {
    // Insert wallet first
    await sql`
      INSERT INTO wallets (id, address, chat_id, private_key, mnemonic)
      VALUES (${id}, ${address}, ${chatId.toString()}, ${privateKey}, ${mnemonic});
    `;

    // Then insert admin
    await sql`
      INSERT INTO admins (wallet_id, user_id, username)
      VALUES (${id}, ${adminId.toString()}, ${adminUsername});
    `;
  } catch (error) {
    console.error('Failed to create wallet:', error);
    throw error;
  }
}

export async function getWallet(chatId: number): Promise<DBWallet | null> {
  try {
    const result = await sql<DBWallet>`
      SELECT * FROM wallets WHERE chat_id = ${chatId.toString()};
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Failed to get wallet:', error);
    throw error;
  }
}

export async function getAllWallets(): Promise<DBWallet[]> {
  try {
    const result = await sql<DBWallet>`
      SELECT * FROM wallets;
    `;
    return result.rows;
  } catch (error) {
    console.error('Failed to get all wallets:', error);
    throw error;
  }
}

// Admin operations
export async function getAdmins(walletId: string): Promise<DBAdmin[]> {
  try {
    const result = await sql<DBAdmin>`
      SELECT * FROM admins WHERE wallet_id = ${walletId};
    `;
    return result.rows;
  } catch (error) {
    console.error('Failed to get admins:', error);
    throw error;
  }
}

export async function addAdmin(
  walletId: string,
  userId: number,
  username: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO admins (wallet_id, user_id, username)
      VALUES (${walletId}, ${userId.toString()}, ${username});
    `;
  } catch (error) {
    console.error('Failed to add admin:', error);
    throw error;
  }
}

// Transaction operations
export async function createTransaction(
  id: string,
  walletId: string,
  amount: string,
  recipient: string,
  description: string,
  txHash: string | null
): Promise<void> {
  try {
    await sql`
      INSERT INTO transactions (id, wallet_id, amount, recipient, description, tx_hash, approved)
      VALUES (${id}, ${walletId}, ${amount}, ${recipient}, ${description}, ${txHash}, true);
    `;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    throw error;
  }
}

export async function getTransactions(walletId: string): Promise<DBTransaction[]> {
  try {
    const result = await sql<DBTransaction>`
      SELECT * FROM transactions 
      WHERE wallet_id = ${walletId}
      ORDER BY created_at DESC;
    `;
    return result.rows;
  } catch (error) {
    console.error('Failed to get transactions:', error);
    throw error;
  }
} 