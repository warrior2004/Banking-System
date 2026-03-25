const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller");

const transactionRoutes = Router();

/**
 * @route   POST /api/transactions/
 * @desc    Standard User-to-User Transfer
 * @access  Private (All Users)
 */
transactionRoutes.post(
    "/", 
    authMiddleware.authMiddleware, 
    transactionController.createTransaction
);

/**
 * @route   POST /api/transactions/system/seed-funds
 * @desc    Initialize System/Admin account with capital (Minting)
 * @access  Private (System User Only)
 */
transactionRoutes.post(
    "/system/seed-funds", 
    authMiddleware.authSystemUserMiddleware, 
    transactionController.seedSystemFunds
);

/**
 * @route   POST /api/transactions/system/initial-funds
 * @desc    Transfer funds from System to a specific User account
 * @access  Private (System User Only)
 */
transactionRoutes.post(
    "/system/initial-funds", 
    authMiddleware.authSystemUserMiddleware, 
    transactionController.createInitialFundsTransaction
);

module.exports = transactionRoutes;