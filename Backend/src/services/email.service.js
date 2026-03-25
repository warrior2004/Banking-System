const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

/**
 * Generic internal sender
 * Improved with a "fire and forget" safe wrapper
 */
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"Banking System Support" <${process.env.EMAIL_USER}>`,
            ...options
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email Sent: ${info.messageId}`);
        return info;
    } catch (error) {
        // In a real bank, you'd log this to a service like Sentry or Winston
        console.error('CRITICAL: Email Delivery Failed:', error.message);
    }
};

/**
 * Helper to generate a consistent HTML wrapper
 */
const emailTemplate = (content) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Banking System</h2>
        <div style="color: #333; line-height: 1.6;">${content}</div>
        <footer style="margin-top: 20px; font-size: 12px; color: #888;">
            This is an automated message. Please do not reply.
        </footer>
    </div>
`;

async function sendRegistrationEmail(userEmail, name) {
    const html = emailTemplate(`
        <p>Hello <strong>${name}</strong>,</p>
        <p>Welcome! Your account has been successfully created. You can now start managing your funds securely.</p>
    `);
    
    // We don't necessarily need to await this in the controller
    return sendEmail({ to: userEmail, subject: 'Welcome!', html });
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const html = emailTemplate(`
        <p>Hello ${name},</p>
        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
            <strong>Amount:</strong> $${amount}<br>
            <strong>To Account:</strong> ${toAccount}<br>
            <strong>Status:</strong> <span style="color: green;">Successful</span>
        </p>
    `);

    return sendEmail({ to: userEmail, subject: 'Transaction Confirmation', html });
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const html = emailTemplate(`
        <p>Hello ${name},</p>
        <p>Your attempt to send <strong>$${amount}</strong> to account <strong>${toAccount}</strong> failed.</p>
        <p>Please check your balance or contact support if the issue persists.</p>
    `);

    return sendEmail({ to: userEmail, subject: 'Alert: Transaction Failed', html });
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};