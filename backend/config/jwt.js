const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// ✅ FIX: NO FALLBACK - Crash if missing
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// ✅ Check if secret exists
if (!JWT_SECRET) {
    console.error('❌ Fatal Error: JWT_SECRET is not defined in environment variables');
    console.error('Please add JWT_SECRET to your .env file');
    process.exit(1);
}

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    JWT_SECRET,
    JWT_EXPIRE,
    generateToken,
    verifyToken
};