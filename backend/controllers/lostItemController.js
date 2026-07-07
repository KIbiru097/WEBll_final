const LostItem = require('../models/LostItem');
const pool = require('../config/db');

exports.getAllLostItems = async (req, res) => {
    try {
        const { search, category, location, status, user_id, page = 1, limit = 10 } = req.query;
        const items = await LostItem.getAll({ search, category, location, status, user_id, page, limit });
        
        res.json({
            success: true,
            data: items,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get lost items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getLostItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await LostItem.findById(id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Lost item not found'
            });
        }
        
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Get lost item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.createLostItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { item_name, category, description, location_lost, date_lost } = req.body;
        const image = req.file ? req.file.path : null;

        const item = await LostItem.create({
            user_id: userId,
            item_name,
            category,
            description,
            location_lost,
            date_lost,
            image
        });

        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
            [userId, 'REPORT_LOST', `Reported lost item: ${item_name}`, req.ip]
        );

        res.status(201).json({
            success: true,
            message: 'Lost item reported successfully',
            data: item
        });
    } catch (error) {
        console.error('Create lost item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.updateLostItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, category, description, location_lost, date_lost, status } = req.body;
        const image = req.file ? req.file.path : null;

        const item = await LostItem.findById(id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Lost item not found'
            });
        }

        if (item.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this item'
            });
        }

        const updated = await LostItem.update(id, {
            item_name, category, description, location_lost, date_lost, status, image
        });

        res.json({
            success: true,
            message: 'Lost item updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Update lost item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.deleteLostItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await LostItem.findById(id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Lost item not found'
            });
        }

        if (item.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this item'
            });
        }

        await LostItem.delete(id);

        res.json({
            success: true,
            message: 'Lost item deleted successfully'
        });
    } catch (error) {
        console.error('Delete lost item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
