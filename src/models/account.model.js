const mongoose = require("mongoose");
const ledgerModel = require("./ledger.model");

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Account must be associated with a user"],
        index: true
    },
    status: {
        type: String,
        enum: ["ACTIVE", "FROZEN", "CLOSED"],
        default: "ACTIVE"
    },
    currency: {
        type: String,
        default: "INR"
    }
}, { timestamps: true });

accountSchema.methods.getBalance = async function () {
    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                balance: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] },
                            "$amount",
                            { $multiply: ["$amount", -1] } // Subtract if DEBIT
                        ]
                    }
                }
            }
        }
    ]);

    return balanceData.length > 0 ? balanceData[0].balance : 0;
};

module.exports = mongoose.model("account", accountSchema);