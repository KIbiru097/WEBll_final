const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // =============================================
    // CREATE USER
    // =============================================
    static async create(userData) {
        const { full_name, email, password, role = 'student', phone } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (full_name, email, password, role, phone) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, full_name, email, role, phone, created_at`,
            [full_name, email, hashedPassword, role, phone]
        );
        return result.rows[0];
    }

    // =============================================
    // FIND USER BY EMAIL
    // =============================================
    
    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }

    // =============================================
    // FIND USER BY ID
    // =============================================
    static async findById(id) {
        const result = await pool.query(
            'SELECT id, full_name, email, role, phone, profile_pic, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    // =============================================
    // UPDATE PROFILE
    // =============================================
    static async updateProfile(id, data) {
        const { full_name, phone, profile_pic } = data;
        const result = await pool.query(
            `UPDATE users 
             SET full_name = COALESCE($1, full_name),
                 phone = COALESCE($2, phone),
                 profile_pic = COALESCE($3, profile_pic),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING id, full_name, email, role, phone, profile_pic`,
            [full_name, phone, profile_pic, id]
        );
        return result.rows[0];
    }

    // =============================================
    // CHANGE PASSWORD - FIXED with bcrypt.compare
    // =============================================
    static async changePassword(id, newPassword) {
        // ✅ FIX: Get existing password hashes from history
        const history = await pool.query(
            `SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC`,
            [id]
        );

        // ✅ FIX: Compare the plain new password against each stored hash
        for (const row of history.rows) {
            const isReused = await bcrypt.compare(newPassword, row.password_hash);
            if (isReused) {
                throw new Error('You cannot use a previously used password');
            }
        }

        // ✅ Only hash once we know it's not reused
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const result = await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, id]
        );

        // Save to password history
        await pool.query(
            `INSERT INTO password_history (user_id, password_hash) 
             VALUES ($1, $2)`,
            [id, hashedPassword]
        );

        // Keep only last 5 passwords
        await pool.query(
            `DELETE FROM password_history 
             WHERE user_id = $1 
             AND id NOT IN (
                 SELECT id FROM password_history 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT 5
             )`,
            [id]
        );

        return result.rowCount > 0;
    }

    // =============================================
    // FORGOT PASSWORD METHODS
    // =============================================
    
    static async saveResetToken(email, token, expires) {
        const result = await pool.query(
            `UPDATE users 
             SET reset_token = $1, reset_token_expires = $2 
             WHERE email = $3 
             RETURNING id, email, full_name`,
            [token, expires, email]
        );
        return result.rows[0];
    }

    static async findByResetToken(token) {
        const result = await pool.query(
            `SELECT * FROM users 
             WHERE reset_token = $1 AND reset_token_expires > NOW()`,
            [token]
        );
        return result.rows[0];
    }

    // =============================================
    // RESET PASSWORD WITH TOKEN - FIXED with bcrypt.compare
    // =============================================
    static async resetPasswordWithToken(email, newPassword) {
        // Get user first
        const user = await this.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        // ✅ FIX: Get existing password hashes from history
        const history = await pool.query(
            `SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC`,
            [user.id]
        );

        // ✅ FIX: Compare the plain new password against each stored hash
        for (const row of history.rows) {
            const isReused = await bcrypt.compare(newPassword, row.password_hash);
            if (isReused) {
                throw new Error('You cannot use a previously used password');
            }
        }

        // ✅ Only hash once we know it's not reused
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const result = await pool.query(
            `UPDATE users 
             SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE email = $2 
             RETURNING id, email, full_name`,
            [hashedPassword, email]
        );

        // Save to password history
        await pool.query(
            `INSERT INTO password_history (user_id, password_hash) 
             VALUES ($1, $2)`,
            [user.id, hashedPassword]
        );

        // Keep only last 5 passwords
        await pool.query(
            `DELETE FROM password_history 
             WHERE user_id = $1 
             AND id NOT IN (
                 SELECT id FROM password_history 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT 5
             )`,
            [user.id]
        );

        return result.rows[0];
    }

    // =============================================
    // PASSWORD HISTORY METHODS
    // =============================================
    
    static async savePasswordHistory(userId, passwordHash) {
        const result = await pool.query(
            `INSERT INTO password_history (user_id, password_hash) 
             VALUES ($1, $2) 
             RETURNING id`,
            [userId, passwordHash]
        );
        
        await pool.query(
            `DELETE FROM password_history 
             WHERE user_id = $1 
             AND id NOT IN (
                 SELECT id FROM password_history 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT 5
             )`,
            [userId]
        );
        
        return result.rows[0];
    }

    // ✅ FIX: isPasswordUsed now uses bcrypt.compare
    static async isPasswordUsed(userId, plainPassword) {
        const history = await pool.query(
            `SELECT password_hash FROM password_history WHERE user_id = $1`,
            [userId]
        );

        for (const row of history.rows) {
            const isReused = await bcrypt.compare(plainPassword, row.password_hash);
            if (isReused) {
                return true;
            }
        }
        return false;
    }

    static async getLastPasswords(userId, limit = 5) {
        const result = await pool.query(
            `SELECT password_hash, created_at 
             FROM password_history 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    static async getPasswordHistoryCount(userId) {
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM password_history WHERE user_id = $1',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    static async clearPasswordHistory(userId) {
        const result = await pool.query(
            'DELETE FROM password_history WHERE user_id = $1',
            [userId]
        );
        return result.rowCount > 0;
    }

    // =============================================
    // ADMIN METHODS
    // =============================================
    
    static async getAll(filters = {}) {
        const { role, search, page = 1, limit = 10 } = filters;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT id, full_name, email, role, phone, profile_pic, created_at
            FROM users WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (role) {
            query += ` AND role = $${paramCount}`;
            params.push(role);
            paramCount++;
        }

        if (search) {
            query += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getCount(filters = {}) {
        const { role, search } = filters;
        let query = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (role) {
            query += ` AND role = $${paramCount}`;
            params.push(role);
            paramCount++;
        }

        if (search) {
            query += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        const result = await pool.query(query, params);
        return parseInt(result.rows[0].count);
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        return result.rowCount > 0;
    }

    // =============================================
    // UTILITY METHODS
    // =============================================
    
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async updateLastLogin(id) {
        const result = await pool.query(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
            [id]
        );
        return result.rowCount > 0;
    }

    static async getStats() {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE role = 'student') as students,
                COUNT(*) FILTER (WHERE role = 'admin') as admins
             FROM users`
        );
        return result.rows[0];
    }

    static async isAdmin(userId) {
        const result = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );
        return result.rows.length > 0 && result.rows[0].role === 'admin';
    }

    static async findByResetTokenRaw(token) {
        const result = await pool.query(
            'SELECT * FROM users WHERE reset_token = $1',
            [token]
        );
        return result.rows[0];
    }

    static async clearResetToken(email) {
        const result = await pool.query(
            `UPDATE users 
             SET reset_token = NULL, reset_token_expires = NULL 
             WHERE email = $1`,
            [email]
        );
        return result.rowCount > 0;
    }
}

module.exports = User;