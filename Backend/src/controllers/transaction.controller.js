const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/**
 * 1. Standard User-to-User Transfer
 */
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    if (fromAccount === toAccount) {
        return res.status(400).json({ message: "Sender and receiver cannot be the same" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // IDEMPOTENCY CHECK
        const existingTx = await transactionModel.findOne({ idempotencyKey }).session(session);
        if (existingTx) {
            await session.abortTransaction();
            return res.status(200).json({ message: "Processed", transaction: existingTx });
        }

        // FETCH ACCOUNTS
        const fromUserAccount = await accountModel.findById(fromAccount).session(session);
        const toUserAccount = await accountModel.findById(toAccount).session(session);

        if (!fromUserAccount || !toUserAccount || fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            throw new Error("Invalid or Inactive accounts!");
        }

        // BALANCE CHECK
        const currentBalance = await fromUserAccount.getBalance();
        if (currentBalance < amount) {
            throw new Error(`Insufficient funds: Available: ${currentBalance}`);
        }

        // CREATE TRANSACTION RECORD
        const [transaction] = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "COMPLETED"
        }], { session });

        // CREATE LEDGER ENTRIES (The actual money move)
        await ledgerModel.create([
            { account: fromAccount, amount, transaction: transaction._id, type: "DEBIT" },
            { account: toAccount, amount, transaction: transaction._id, type: "CREDIT" }
        ], { session, ordered: true });

        await session.commitTransaction();

        // Background Tasks
        emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
            .catch(err => console.error("Email failed:", err));

        return res.status(201).json({ message: "Success", transaction });

    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
}

/**
 * 2. System to User Funding (Initial Capital)
 */
async function createInitialFundsTransaction(req, res) {
    let { toAccount, amount, idempotencyKey } = req.body;
    toAccount = toAccount?.trim();

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({ message: "toAccount, amount, and idempotencyKey are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(toAccount)) {
        return res.status(400).json({ message: "Invalid toAccount ID format" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const toUserAccount = await accountModel.findById(toAccount).session(session);
        if (!toUserAccount) throw new Error("Target account not found");

        const fromUserAccount = await accountModel.findOne({ user: req.user._id }).session(session);
        if (!fromUserAccount) throw new Error("System user account not found.");

        const existingTx = await transactionModel.findOne({ idempotencyKey }).session(session);
        if (existingTx) {
            await session.abortTransaction();
            return res.status(200).json({ message: "Already processed", transaction: existingTx });
        }

        const [transaction] = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "COMPLETED"
        }], { session });

        await ledgerModel.create([
            { account: fromUserAccount._id, amount, transaction: transaction._id, type: "DEBIT" },
            { account: toAccount, amount, transaction: transaction._id, type: "CREDIT" }
        ], { session, ordered: true });

        await session.commitTransaction();
        return res.status(201).json({ message: "Funds added successfully", transaction });

    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
}

/**
 * 3. Seed System Funds (The "Mint" - Use this to give the Admin money)
 */
async function seedSystemFunds(req, res) {
    const { amount } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const systemAccount = await accountModel.findOne({ user: req.user._id }).session(session);
        if (!systemAccount) throw new Error("System account not found");

        const [transaction] = await transactionModel.create([{
            fromAccount: null, // Originates from the "mint"
            toAccount: systemAccount._id,
            amount,
            idempotencyKey: `seed-${Date.now()}`,
            status: "COMPLETED"
        }], { session });

        await ledgerModel.create([{
            account: systemAccount._id,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        await session.commitTransaction();
        res.status(200).json({ message: "System account seeded successfully", balance: amount });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    seedSystemFunds
};