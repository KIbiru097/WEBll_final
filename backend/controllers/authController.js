const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

// =============================================
// PASSWORD VALIDATION HELPER
// =============================================
const validatePassword = (password) => {
    const minLength = 8;
    const hasNumber = /\d/;
    const hasLetter = /[a-zA-Z]/;
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/;
    
    if (password.length < minLength) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!hasNumber.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!hasLetter.test(password)) {
        return { valid: false, message: 'Password must contain at least one letter' };
    }
    if (!hasSymbol.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }
    return { valid: true };
};

// =============================================
// REGISTER USER
// =============================================
exports.register = async (req, res) => {
    try {
        const { full_name, email, password, phone } = req.body;
        const role = 'student';

        // Validate password
        const validation = validatePassword(password);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({ full_name, email, password, phone, role });

        // Save initial password to history
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO password_history (user_id, password_hash) 
             VALUES ($1, $2)`,
            [user.id, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: user
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

// =============================================
// LOGIN USER
// =============================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
            [user.id, 'LOGIN', 'User logged in successfully', req.ip || req.connection.remoteAddress]
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    profile_pic: user.profile_pic
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// =============================================
// GET USER PROFILE
// =============================================
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// =============================================
// UPDATE USER PROFILE
// =============================================
exports.updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        
        const user = await User.updateProfile(req.user.id, { full_name, phone });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'PROFILE_UPDATED', 'User updated profile']
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// =============================================
// CHANGE PASSWORD - User.changePassword handles history check
// =============================================
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        
        // Validate new password
        const validation = validatePassword(new_password);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }
        
        // Get user with password
        const user = await User.findByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(current_password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Change password - this handles history check
        try {
            await User.changePassword(req.user.id, new_password);
        } catch (error) {
            // Catch specific error from User.changePassword
            if (error.message === 'You cannot use a previously used password') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            throw error;
        }

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'PASSWORD_CHANGED', 'User changed password']
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// =============================================
// FORGOT PASSWORD - Request Reset
// =============================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if user exists
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        // Save token to database
        await User.saveResetToken(email, resetToken, resetTokenExpires);

        // Send email
        const emailSent = await sendPasswordResetEmail(email, resetToken, user.full_name);

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send reset email. Please try again later.'
            });
        }

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [user.id, 'PASSWORD_RESET_REQUESTED', 'User requested password reset']
        );

        res.json({
            success: true,
            message: 'Password reset link sent to your email'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// =============================================
// RESET PASSWORD - Set New Password
// ============================================
exports.resetPassword = async (req, res) => {
    try {
        const { token, new_password } = req.body;

        if (!token || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        // Validate password
        const validation = validatePassword(new_password);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        // Find user by token
        const user = await User.findByResetToken(token);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Reset password - handles history check
        try {
            await User.resetPasswordWithToken(user.email, new_password);
        } catch (error) {
            if (error.message === 'You cannot use a previously used password') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            throw error;
        }

        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [user.id, 'PASSWORD_RESET', 'Password reset successfully']
        );

        res.json({
            success: true,
            message: 'Password reset successfully. Please login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// =============================================
// VERIFY RESET TOKEN
// =============================================
exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const user = await User.findByResetToken(token);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            email: user.email
        });

    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// =============================================
// LOGOUT USER
// =============================================
exports.logout = async (req, res) => {
    try {
        // Log activity
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'LOGOUT', 'User logged out']
        );

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// =============================================
// DELETE ACCOUNT
// =============================================
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Log activity before deletion
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'ACCOUNT_DELETED', 'User deleted their account']
        );

        // Delete user
        const deleted = await User.delete(userId);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// =============================================
// GET USER STATISTICS (for dashboard)
// =============================================
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's lost items count
        const lostCount = await pool.query(
            'SELECT COUNT(*) as count FROM lost_items WHERE user_id = $1',
            [userId]
        );

        // Get user's found items count
        const foundCount = await pool.query(
            'SELECT COUNT(*) as count FROM found_items WHERE user_id = $1',
            [userId]
        );

        // Get user's claims count
        const claimsCount = await pool.query(
            'SELECT COUNT(*) as count FROM claims WHERE claimant_id = $1',
            [userId]
        );

        // Get approved claims count
        const approvedClaims = await pool.query(
            'SELECT COUNT(*) as count FROM claims WHERE claimant_id = $1 AND status = $2',
            [userId, 'approved']
        );

        res.json({
            success: true,
            data: {
                total_lost_reports: parseInt(lostCount.rows[0].count),
                total_found_reports: parseInt(foundCount.rows[0].count),
                total_claims: parseInt(claimsCount.rows[0].count),
                approved_claims: parseInt(approvedClaims.rows[0].count)
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
