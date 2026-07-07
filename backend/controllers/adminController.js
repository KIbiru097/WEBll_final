const pool = require('../config/db');

const itemTableForType = (itemType) => (itemType === 'lost' ? 'lost_items' : 'found_items');
const openStatusForType = (itemType) => (itemType === 'lost' ? 'open' : 'available');
const statusForDecision = (itemType, claimStatus) => {
    if (claimStatus === 'approved') return 'returned';
    if (claimStatus === 'rejected') return openStatusForType(itemType);
    return null;
};

// =============================================
// DASHBOARD
// =============================================
exports.getDashboardStats = async (req, res) => {
    try {
        const [userStats, lostStats, foundStats, claimStats, recentActivity, topCategories, topLocations] = await Promise.all([
            pool.query(`SELECT COUNT(*) as total_users, COUNT(*) FILTER (WHERE role = 'student') as total_students, COUNT(*) FILTER (WHERE role = 'admin') as total_admins FROM users`),
            pool.query(`SELECT COUNT(*) as total_lost, COUNT(*) FILTER (WHERE status = 'open') as open_lost, COUNT(*) FILTER (WHERE status = 'claimed') as claimed_lost, COUNT(*) FILTER (WHERE status = 'returned') as returned_lost FROM lost_items`),
            pool.query(`SELECT COUNT(*) as total_found, COUNT(*) FILTER (WHERE status = 'available') as available_found, COUNT(*) FILTER (WHERE status = 'claimed') as claimed_found, COUNT(*) FILTER (WHERE status = 'returned') as returned_found FROM found_items`),
            pool.query(`SELECT COUNT(*) as total_claims, COUNT(*) FILTER (WHERE status = 'pending') as pending_claims, COUNT(*) FILTER (WHERE status = 'approved') as approved_claims, COUNT(*) FILTER (WHERE status = 'rejected') as rejected_claims FROM claims`),
            pool.query(`SELECT al.*, u.full_name as user_name FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 10`),
            pool.query(`SELECT category, COUNT(*) as count FROM (SELECT category FROM lost_items UNION ALL SELECT category FROM found_items) all_items GROUP BY category ORDER BY count DESC LIMIT 5`),
            pool.query(`SELECT location_lost as location, COUNT(*) as count FROM lost_items GROUP BY location_lost ORDER BY count DESC LIMIT 5`)
        ]);

        res.json({
            success: true,
            data: {
                users: userStats.rows[0],
                lost_items: lostStats.rows[0],
                found_items: foundStats.rows[0],
                claims: claimStats.rows[0],
                recent_activity: recentActivity.rows,
                top_categories: topCategories.rows,
                top_locations: topLocations.rows
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// =============================================
// USERS
// =============================================
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const params = [];
        let query = `SELECT id, full_name, email, role, phone, profile_pic, created_at FROM users WHERE 1=1`;
        let countQuery = `SELECT COUNT(*) as count FROM users WHERE 1=1`;

        if (role) {
            query += ` AND role = $${params.length + 1}`;
            countQuery += ` AND role = $${params.length + 1}`;
            params.push(role);
        }
        if (search) {
            query += ` AND (full_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
            countQuery += ` AND (full_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const [result, countResult] = await Promise.all([
            pool.query(query, [...params, limit, offset]),
            pool.query(countQuery, params)
        ]);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        await pool.query('INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'USER_DELETED', `Deleted user ID: ${id}`]);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// =============================================
// STATISTICS & LOGS
// =============================================
exports.getStatistics = async (req, res) => {
    try {
        const [monthlyTrends, successRate, avgResponseTime] = await Promise.all([
            pool.query(`
                SELECT DATE_TRUNC('month', created_at) as month, 
                       COUNT(*) FILTER (WHERE TABLE_NAME = 'lost_items') as lost_reports, 
                       COUNT(*) FILTER (WHERE TABLE_NAME = 'found_items') as found_reports, 
                       COUNT(*) FILTER (WHERE TABLE_NAME = 'claims') as claims_submitted 
                FROM (
                    SELECT created_at, 'lost_items' as TABLE_NAME FROM lost_items 
                    UNION ALL 
                    SELECT created_at, 'found_items' FROM found_items 
                    UNION ALL 
                    SELECT created_at, 'claims' FROM claims
                ) all_activity 
                WHERE created_at >= CURRENT_DATE - INTERVAL '6 months' 
                GROUP BY month 
                ORDER BY month DESC
            `),
            pool.query(`
                SELECT COUNT(*) as total_claims, 
                       COUNT(*) FILTER (WHERE status = 'approved') as approved_claims, 
                       COUNT(*) FILTER (WHERE status = 'rejected') as rejected_claims, 
                       COALESCE(ROUND(COUNT(*) FILTER (WHERE status = 'approved') * 100.0 / NULLIF(COUNT(*), 0), 2), 0) as success_rate 
                FROM claims
            `),
            pool.query(`
                SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(reviewed_at, created_at) - created_at))/3600), 0) as avg_hours 
                FROM claims
            `)
        ]);

        res.json({
            success: true,
            data: {
                monthly_trends: monthlyTrends.rows,
                claim_success_rate: successRate.rows[0],
                average_response_time: Math.round(parseFloat(avgResponseTime.rows[0].avg_hours) || 0)
            }
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getActivityLogs = async (req, res) => {
    try {
        const { action, user_id, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const params = [];
        let query = `SELECT al.*, u.full_name as user_name, u.email as user_email FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1`;
        let countQuery = `SELECT COUNT(*) FROM activity_logs al WHERE 1=1`;

        if (action) {
            query += ` AND al.action = $${params.length + 1}`;
            countQuery += ` AND al.action = $${params.length + 1}`;
            params.push(action);
        }
        if (user_id) {
            query += ` AND al.user_id = $${params.length + 1}`;
            countQuery += ` AND al.user_id = $${params.length + 1}`;
            params.push(user_id);
        }

        query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const [result, countResult] = await Promise.all([
            pool.query(query, [...params, limit, offset]),
            pool.query(countQuery, params)
        ]);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        });
    } catch (error) {
        console.error('Activity logs error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// =============================================
// LOST ITEMS
// =============================================
exports.getAllLostItems = async (req, res) => {
    try {
        const { status, category, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const params = [];
        let query = `SELECT li.*, u.full_name as reported_by, u.email as reporter_email FROM lost_items li JOIN users u ON li.user_id = u.id WHERE 1=1`;
        let countQuery = `SELECT COUNT(*) as count FROM lost_items WHERE 1=1`;

        if (status) { query += ` AND li.status = $${params.length + 1}`; countQuery += ` AND status = $${params.length + 1}`; params.push(status); }
        if (category) { query += ` AND li.category = $${params.length + 1}`; countQuery += ` AND category = $${params.length + 1}`; params.push(category); }
        if (search) { query += ` AND (li.item_name ILIKE $${params.length + 1} OR li.description ILIKE $${params.length + 1})`; countQuery += ` AND (item_name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`; params.push(`%${search}%`); }

        query += ` ORDER BY li.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const [result, countResult] = await Promise.all([
            pool.query(query, [...params, limit, offset]),
            pool.query(countQuery, params)
        ]);

        res.json({
            success: true,
            data: result.rows,
            pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countResult.rows[0].count), totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit) }
        });
    } catch (error) {
        console.error('Get lost items error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateLostItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await pool.query(`UPDATE lost_items SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`, [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Lost item not found' });
        await pool.query('INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'LOST_ITEM_UPDATED', `Updated lost item ID: ${id}`]);
        res.json({ success: true, message: 'Lost item updated', data: result.rows[0] });
    } catch (error) {
        console.error('Update lost item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteLostItem = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM lost_items WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Lost item not found' });
        await pool.query('INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'LOST_ITEM_DELETED', `Deleted lost item ID: ${id}`]);
        res.json({ success: true, message: 'Lost item deleted' });
    } catch (error) {
        console.error('Delete lost item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// =============================================
// FOUND ITEMS
// =============================================
exports.getAllFoundItems = async (req, res) => {
    try {
        const { status, category, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const params = [];
        let query = `SELECT fi.*, u.full_name as reported_by, u.email as reporter_email FROM found_items fi JOIN users u ON fi.user_id = u.id WHERE 1=1`;
        let countQuery = `SELECT COUNT(*) as count FROM found_items WHERE 1=1`;

        if (status) { query += ` AND fi.status = $${params.length + 1}`; countQuery += ` AND status = $${params.length + 1}`; params.push(status); }
        if (category) { query += ` AND fi.category = $${params.length + 1}`; countQuery += ` AND category = $${params.length + 1}`; params.push(category); }
        if (search) { query += ` AND (fi.item_name ILIKE $${params.length + 1} OR fi.description ILIKE $${params.length + 1})`; countQuery += ` AND (item_name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`; params.push(`%${search}%`); }

        query += ` ORDER BY fi.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const [result, countResult] = await Promise.all([
            pool.query(query, [...params, limit, offset]),
            pool.query(countQuery, params)
        ]);

        res.json({
            success: true,
            data: result.rows,
            pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countResult.rows[0].count), totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit) }
        });
    } catch (error) {
        console.error('Get found items error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateFoundItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await pool.query(`UPDATE found_items SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`, [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Found item not found' });
        await pool.query('INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'FOUND_ITEM_UPDATED', `Updated found item ID: ${id}`]);
        res.json({ success: true, message: 'Found item updated', data: result.rows[0] });
    } catch (error) {
        console.error('Update found item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteFoundItem = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM found_items WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Found item not found' });
        await pool.query('INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'FOUND_ITEM_DELETED', `Deleted found item ID: ${id}`]);
        res.json({ success: true, message: 'Found item deleted' });
    } catch (error) {
        console.error('Delete found item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
