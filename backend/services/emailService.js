const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify email configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email service is ready to send emails');
    }
});

// Send password reset email
const sendPasswordResetEmail = async (email, token, name) => {
    try {
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        
        const mailOptions = {
            from: `"Lost & Found System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Password Reset - Lost & Found System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">🔐 Password Reset</h1>
                    </div>
                    <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                        <h2>Hello ${name || 'User'},</h2>
                        <p>We received a request to reset your password for your Lost & Found System account.</p>
                        <p>Click the button below to reset your password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                Reset Password
                            </a>
                        </div>
                        <p>Or copy this link: <br>
                        <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a></p>
                        <p><strong style="color: #ff6b6b;">⚠️ This link will expire in 1 hour.</strong></p>
                        <p>If you didn't request this password reset, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                        <p style="font-size: 12px; color: #666; text-align: center;">
                            &copy; ${new Date().getFullYear()} Lost & Found System. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${email}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return false;
    }
};

module.exports = { sendPasswordResetEmail };
