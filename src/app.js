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


/**
 * - USER ROUTES
 */
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)

module.exports = app