"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDB = initializeDB;
exports.createWallet = createWallet;
exports.getWallet = getWallet;
exports.getAllWallets = getAllWallets;
exports.getAdmins = getAdmins;
exports.addAdmin = addAdmin;
exports.createTransaction = createTransaction;
exports.getTransactions = getTransactions;
var postgres_1 = require("@vercel/postgres");
// Database initialization
function initializeDB() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    // Create wallets table
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS wallets (\n        id TEXT PRIMARY KEY,\n        address TEXT UNIQUE NOT NULL,\n        chat_id TEXT NOT NULL,\n        private_key TEXT NOT NULL,\n        mnemonic TEXT NOT NULL,\n        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS wallets (\n        id TEXT PRIMARY KEY,\n        address TEXT UNIQUE NOT NULL,\n        chat_id TEXT NOT NULL,\n        private_key TEXT NOT NULL,\n        mnemonic TEXT NOT NULL,\n        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n      )\n    "])))];
                case 1:
                    // Create wallets table
                    _a.sent();
                    // Create admins table
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS admins (\n        wallet_id TEXT REFERENCES wallets(id),\n        user_id TEXT NOT NULL,\n        username TEXT NOT NULL,\n        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n        PRIMARY KEY (wallet_id, user_id)\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS admins (\n        wallet_id TEXT REFERENCES wallets(id),\n        user_id TEXT NOT NULL,\n        username TEXT NOT NULL,\n        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n        PRIMARY KEY (wallet_id, user_id)\n      )\n    "])))];
                case 2:
                    // Create admins table
                    _a.sent();
                    // Create transactions table
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS transactions (\n        id TEXT PRIMARY KEY,\n        wallet_id TEXT REFERENCES wallets(id),\n        amount TEXT NOT NULL,\n        recipient TEXT NOT NULL,\n        description TEXT,\n        tx_hash TEXT,\n        approved BOOLEAN DEFAULT false,\n        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS transactions (\n        id TEXT PRIMARY KEY,\n        wallet_id TEXT REFERENCES wallets(id),\n        amount TEXT NOT NULL,\n        recipient TEXT NOT NULL,\n        description TEXT,\n        tx_hash TEXT,\n        approved BOOLEAN DEFAULT false,\n        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n      )\n    "])))];
                case 3:
                    // Create transactions table
                    _a.sent();
                    console.log('Database initialized successfully');
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to initialize database:', error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Wallet operations
function createWallet(id, address, chatId, privateKey, mnemonic, adminId, adminUsername) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    // Insert wallet first
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n      INSERT INTO wallets (id, address, chat_id, private_key, mnemonic)\n      VALUES (", ", ", ", ", ", ", ", ", ");\n    "], ["\n      INSERT INTO wallets (id, address, chat_id, private_key, mnemonic)\n      VALUES (", ", ", ", ", ", ", ", ", ");\n    "])), id, address, chatId.toString(), privateKey, mnemonic)];
                case 1:
                    // Insert wallet first
                    _a.sent();
                    // Then insert admin
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n      INSERT INTO admins (wallet_id, user_id, username)\n      VALUES (", ", ", ", ", ");\n    "], ["\n      INSERT INTO admins (wallet_id, user_id, username)\n      VALUES (", ", ", ", ", ");\n    "])), id, adminId.toString(), adminUsername)];
                case 2:
                    // Then insert admin
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Failed to create wallet:', error_2);
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getWallet(chatId) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n      SELECT * FROM wallets WHERE chat_id = ", ";\n    "], ["\n      SELECT * FROM wallets WHERE chat_id = ", ";\n    "])), chatId.toString())];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows[0] || null];
                case 2:
                    error_3 = _a.sent();
                    console.error('Failed to get wallet:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getAllWallets() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n      SELECT * FROM wallets;\n    "], ["\n      SELECT * FROM wallets;\n    "])))];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows];
                case 2:
                    error_4 = _a.sent();
                    console.error('Failed to get all wallets:', error_4);
                    throw error_4;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Admin operations
function getAdmins(walletId) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n      SELECT * FROM admins WHERE wallet_id = ", ";\n    "], ["\n      SELECT * FROM admins WHERE wallet_id = ", ";\n    "])), walletId)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows];
                case 2:
                    error_5 = _a.sent();
                    console.error('Failed to get admins:', error_5);
                    throw error_5;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function addAdmin(walletId, userId, username) {
    return __awaiter(this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n      INSERT INTO admins (wallet_id, user_id, username)\n      VALUES (", ", ", ", ", ");\n    "], ["\n      INSERT INTO admins (wallet_id, user_id, username)\n      VALUES (", ", ", ", ", ");\n    "])), walletId, userId.toString(), username)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    console.error('Failed to add admin:', error_6);
                    throw error_6;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Transaction operations
function createTransaction(id, walletId, amount, recipient, description, txHash) {
    return __awaiter(this, void 0, void 0, function () {
        var error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["\n      INSERT INTO transactions (id, wallet_id, amount, recipient, description, tx_hash, approved)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", true);\n    "], ["\n      INSERT INTO transactions (id, wallet_id, amount, recipient, description, tx_hash, approved)\n      VALUES (", ", ", ", ", ", ", ", ", ", ", ", true);\n    "])), id, walletId, amount, recipient, description, txHash)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_7 = _a.sent();
                    console.error('Failed to create transaction:', error_7);
                    throw error_7;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getTransactions(walletId) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, postgres_1.sql)(templateObject_11 || (templateObject_11 = __makeTemplateObject(["\n      SELECT * FROM transactions \n      WHERE wallet_id = ", "\n      ORDER BY created_at DESC;\n    "], ["\n      SELECT * FROM transactions \n      WHERE wallet_id = ", "\n      ORDER BY created_at DESC;\n    "])), walletId)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.rows];
                case 2:
                    error_8 = _a.sent();
                    console.error('Failed to get transactions:', error_8);
                    throw error_8;
                case 3: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
