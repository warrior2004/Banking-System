const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blackList.model");

async function authMiddleware(req, res, next) {
    // 1. Safe extraction of token to prevent "split of undefined" error
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized access, token is missing!" });
    }

    // 2. Check Blacklist (You should do this in BOTH middlewares)
    const isBlacklisted = await tokenBlackListModel.findOne({ token });
    if (isBlacklisted) {
        return res.status(401).json({ message: "Token is blacklisted" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token ID:", decoded.userId);
        const user = await userModel.findById(decoded.userId);
        console.log("User found in DB:", user ? "YES" : "NO");

        // FIX: If user is not found in DB, stop here!
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        return next();

    } catch (err) {
        return res.status(401).json({ message: "Unauthorized access, token is invalid!" });
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized access, token is missing" });
    }

    try {
        const isBlacklisted = await tokenBlackListModel.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: "Token is invalid (blacklisted)" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId).select("+systemUser");

        // FIX: Check if user exists AND if they are a system user
        if (!user) {
            return res.status(401).json({ message: "System user not found" });
        }

        if (!user.systemUser) {
            return res.status(403).json({ message: "Forbidden access, not a system user" });
        }

        req.user = user;
        return next();
    } 
    catch (err) {
        return res.status(401).json({ message: "Unauthorized access, token is invalid" });
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};