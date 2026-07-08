const pool = require('../config/db');

class LostItem {
    static async create(itemData) {
        const { user_id, item_name, category, description, location_lost, date_lost, image } = itemData;
        
        const result = await pool.query(
            `INSERT INTO lost_items 
             (user_id, item_name, category, description, location_lost, date_lost, image) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [user_id, item_name, category, description, location_lost, date_lost, image]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            `SELECT li.*, u.full_name as reporter_name 
             FROM lost_items li
             JOIN users u ON li.user_id = u.id
             WHERE li.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async getAll(filters = {}) {
        const { search, category, location, status, user_id, page = 1, limit = 10 } = filters;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT li.*, u.full_name as reporter_name 
            FROM lost_items li
            JOIN users u ON li.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (search) {
            query += ` AND (li.item_name ILIKE $${paramCount} OR li.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        if (category) {
            query += ` AND li.category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }
        if (location) {
            query += ` AND li.location_lost ILIKE $${paramCount}`;
            params.push(`%${location}%`);
            paramCount++;
        }
        if (status) {
            query += ` AND li.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        if (user_id) {
            query += ` AND li.user_id = $${paramCount}`;
            params.push(user_id);
            paramCount++;
        }

        query += ` ORDER BY li.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async update(id, itemData) {
        const { item_name, category, description, location_lost, date_lost, status, image } = itemData;
        
        const result = await pool.query(
            `UPDATE lost_items 
             SET item_name = COALESCE($1, item_name),
                 category = COALESCE($2, category),
                 description = COALESCE($3, description),
                 location_lost = COALESCE($4, location_lost),
                 date_lost = COALESCE($5, date_lost),
                 status = COALESCE($6, status),
                 image = COALESCE($7, image),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [item_name, category, description, location_lost, date_lost, status, image, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await pool.query('DELETE FROM lost_items WHERE id = $1', [id]);
        return result.rowCount > 0;
    }

    static async findByUser(userId) {
        const result = await pool.query(
            'SELECT * FROM lost_items WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }
}

module.exports = LostItem;