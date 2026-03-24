const express = require("express");
const cookieParser = require("cookie-parser");


const app = express();

app.use(express.json())
app.use(cookieParser())

/**
 * - ROUTES
 */
const authRouter = require("./routes/auth.route");
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")


/**
 * - USER ROUTES
 */
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

module.exports = app