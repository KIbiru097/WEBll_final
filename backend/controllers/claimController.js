const pool = require('../config/db');
const { validationResult } = require('express-validator');

const itemTableForType = (itemType) => (itemType === 'lost' ? 'lost_items' : 'found_items');
const openStatusForType = (itemType) => (itemType === 'lost' ? 'open' : 'available');

const statusForDecision = (itemType, claimStatus) => {
    if (claimStatus === 'approved') return 'returned';
    if (claimStatus === 'rejected') return openStatusForType(itemType);
    return null;
};

// =============================================
// CREATE CLAIM
// =============================================
exports.createClaim = async (req, res) => {
    const client = await pool.connect();
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const claimantId = req.user.id;
        const { 
            item_id, 
            item_type, 
            reason, 
            brand, 
            color, 
            serial_number, 
            unique_marks 
        } = req.body;
        const proof_image = req.file ? req.file.path : null;
        const itemTable = itemTableForType(item_type);
        const itemOpenStatus = openStatusForType(item_type);

        await client.query('BEGIN');

        // Check if item exists
        const check = await client.query(`SELECT * FROM ${itemTable} WHERE id = $1 FOR UPDATE`, [item_id]);
        
        if (check.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: `${item_type === 'lost' ? 'Lost' : 'Found'} item not found`
            });
        }

        if (check.rows[0].user_id === claimantId) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'You cannot submit a claim for an item you reported'
            });
        }

        if (check.rows[0].status !== itemOpenStatus) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'This item is not available for new claims'
            });
        }

        // Check if user already claimed this item
        const existing = await client.query(
            `SELECT * FROM claims 
             WHERE item_id = $1
               AND item_type = $2
               AND claimant_id = $3
               AND status IN ('pending', 'approved')`,
            [item_id, item_type, claimantId]
        );
        
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a claim for this item'
            });
        }

        // Insert claim
        const result = await client.query(
            `INSERT INTO claims 
             (claimant_id, item_id, item_type, reason, brand, color, serial_number, unique_marks, proof_image)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [claimantId, item_id, item_type, reason, brand, color, serial_number, unique_marks, proof_image]
        );

        // Log activity
        await client.query(
            `INSERT INTO activity_logs (user_id, action, details) 
             VALUES ($1, $2, $3)`,
            [claimantId, 'CLAIM_SUBMITTED', `Submitted claim for item ID: ${item_id}`]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Claim submitted successfully',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create claim error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    } finally {
        client.release();
    }
};

// =============================================
// GET CLAIMS
// =============================================
exports.getClaims = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const isAdmin = req.user.role === 'admin';

        let query = `
            SELECT c.*, 
                   u.full_name as claimant_name, 
                   u.email as claimant_email,
                   CASE 
                       WHEN c.item_type = 'lost' THEN (SELECT item_name FROM lost_items WHERE id = c.item_id)
                       WHEN c.item_type = 'found' THEN (SELECT item_name FROM found_items WHERE id = c.item_id)
                   END as item_name,
                   CASE 
                       WHEN c.item_type = 'lost' THEN (SELECT category FROM lost_items WHERE id = c.item_id)
                       WHEN c.item_type = 'found' THEN (SELECT category FROM found_items WHERE id = c.item_id)
                   END as item_category,
                   CASE 
                       WHEN c.item_type = 'lost' THEN (SELECT image FROM lost_items WHERE id = c.item_id)
                       WHEN c.item_type = 'found' THEN (SELECT image FROM found_items WHERE id = c.item_id)
                   END as item_image
            FROM claims c
            JOIN users u ON c.claimant_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;

        if (status) {
            query += ` AND c.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (!isAdmin) {
            query += ` AND c.claimant_id = $${paramCount}`;
            params.push(req.user.id);
            paramCount++;
        }

        query += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) as count FROM claims c WHERE 1=1`;
        const countParams = [];
        let countParamCount = 1;

        if (status) {
            countQuery += ` AND c.status = $${countParamCount}`;
            countParams.push(status);
            countParamCount++;
        }

        if (!isAdmin) {
            countQuery += ` AND c.claimant_id = $${countParamCount}`;
            countParams.push(req.user.id);
            countParamCount++;
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get claims error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// =============================================
// GET CLAIM BY ID
// =============================================
exports.getClaimById = async (req, res) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user.role === 'admin';

        let query = `
            SELECT c.*, 
                   u.full_name as claimant_name, 
                   u.email as claimant_email,
                   u.phone as claimant_phone,
                   CASE 
                       WHEN c.item_type = 'lost' THEN (SELECT item_name FROM lost_items WHERE id = c.item_id)
                       WHEN c.item_type = 'found' THEN (SELECT item_name FROM found_items WHERE id = c.item_id)
                   END as item_name,
                   CASE 
                       WHEN c.item_type = 'lost' THEN (SELECT category FROM lost_items WHERE id = c.item_id)
                       WHEN c.item_type = 'found' THEN (SELECT category FROM found_items WHERE id = c.item_id)
                   END as item_category,
                   CASE 
                       WHEN c.item_type = 'lost' THEN (SELECT status FROM lost_items WHERE id = c.item_id)
                       WHEN c.item_type = 'found' THEN (SELECT status FROM found_items WHERE id = c.item_id)
                   END as item_status,
                   CASE 
                       WHEN c.item_type = 'lost' THEN (SELECT image FROM lost_items WHERE id = c.item_id)
                       WHEN c.item_type = 'found' THEN (SELECT image FROM found_items WHERE id = c.item_id)
                   END as item_image
            FROM claims c
            JOIN users u ON c.claimant_id = u.id
            WHERE c.id = $1
        `;
        
        const params = [id];

        if (!isAdmin) {
            query += ` AND c.claimant_id = $2`;
            params.push(req.user.id);
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Claim not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get claim error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// =============================================
// UPDATE CLAIM STATUS (Admin Only)
// =============================================
