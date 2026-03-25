const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        // Removed required: true to allow System Seeding (Minting)
        required: false, 
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must be associated with a to account"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED"
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true, "Amount is required for creating a transaction"],
        min: [0, "Transaction amount cannot be negative"]
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key is required for creating a transaction"],
        index: true,
        unique: true
    }
}, {
    timestamps: true
});

// Optimization: Indexing toAccount and status for faster history lookups
transactionSchema.index({ toAccount: 1, status: 1 });
transactionSchema.index({ fromAccount: 1, status: 1 });

const transactionModel = mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;