const { Router } = require('express')
const authMiddleware = require('../middleware/auth.middleware')
const transactionController  = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * - POST /api/transaction
 * - CREATE a new transaction
 */
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.transactionController)

module.exports = transactionRoutes