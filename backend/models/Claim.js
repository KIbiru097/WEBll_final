const pool = require('../config/db');

class Claim {
    static async create(claimData) {
        const { 
            claimant_id, item_id, item_type, reason, 
            brand, color, serial_number, unique_marks, proof_image 
        } = claimData;
        
        const result = await pool.query(
            `INSERT INTO claims 
             (claimant_id, item_id, item_type, reason, brand, color, serial_number, unique_marks, proof_image) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [claimant_id, item_id, item_type, reason, brand, color, serial_number, unique_marks, proof_image]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            `SELECT c.*, u.full_name as claimant_name, u.email as claimant_email,
                    CASE 
                        WHEN c.item_type = 'lost' THEN (SELECT item_name FROM lost_items WHERE id = c.item_id)
                        WHEN c.item_type = 'found' THEN (SELECT item_name FROM found_items WHERE id = c.item_id)
                    END as item_name
             FROM claims c
             JOIN users u ON c.claimant_id = u.id
             WHERE c.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async getAll(filters = {}) {
        const { claimant_id, status, page = 1, limit = 10 } = filters;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT c.*, u.full_name as claimant_name, u.email as claimant_email,
                    CASE 
                        WHEN c.item_type = 'lost' THEN (SELECT item_name FROM lost_items WHERE id = c.item_id)
                        WHEN c.item_type = 'found' THEN (SELECT item_name FROM found_items WHERE id = c.item_id)
                    END as item_name
            FROM claims c
            JOIN users u ON c.claimant_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (claimant_id) {
            query += ` AND c.claimant_id = $${paramCount}`;
            params.push(claimant_id);
            paramCount++;
        }
        if (status) {
            query += ` AND c.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        query += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async updateStatus(id, statusData) {
        const { status, admin_notes } = statusData;
        
        const result = await pool.query(
            `UPDATE claims 
             SET status = $1,
                 admin_notes = COALESCE($2, admin_notes),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [status, admin_notes, id]
        );
        return result.rows[0];
    }

    static async findByClaimant(claimantId) {
        const result = await pool.query(
            `SELECT c.*, 
                    CASE 
                        WHEN c.item_type = 'lost' THEN (SELECT item_name FROM lost_items WHERE id = c.item_id)
                        WHEN c.item_type = 'found' THEN (SELECT item_name FROM found_items WHERE id = c.item_id)
                    END as item_name
             FROM claims c
             WHERE c.claimant_id = $1
             ORDER BY c.created_at DESC`,
            [claimantId]
        );
        return result.rows;
    }
}

module.exports = Claim;