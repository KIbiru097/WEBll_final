const FoundItem = require('../models/FoundItem');
const pool = require('../config/db');

exports.getAllFoundItems = async (req, res) => {
    try {
        const { search, category, location, status, user_id, page = 1, limit = 10 } = req.query;
        const items = await FoundItem.getAll({ search, category, location, status, user_id, page, limit });
        
        res.json({
            success: true,
            data: items,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get found items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getFoundItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await FoundItem.findById(id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Found item not found'
            });
        }
        
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Get found item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.createFoundItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { item_name, category, description, location_found, date_found } = req.body;
        const image = req.file ? req.file.path : null;

        const item = await FoundItem.create({
            user_id: userId,
            item_name,
            category,
            description,
            location_found,
            date_found,
            image
        });

        await pool.query(
            'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
            [userId, 'REPORT_FOUND', `Reported found item: ${item_name}`, req.ip]
        );

        res.status(201).json({
            success: true,
            message: 'Found item reported successfully',
            data: item
        });
    } catch (error) {
        console.error('Create found item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.updateFoundItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, category, description, location_found, date_found, status } = req.body;
        const image = req.file ? req.file.path : null;

        const item = await FoundItem.findById(id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Found item not found'
            });
        }

        if (item.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this item'
            });
        }

        const updated = await FoundItem.update(id, {
            item_name, category, description, location_found, date_found, status, image
        });

        res.json({
            success: true,
            message: 'Found item updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Update found item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.deleteFoundItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await FoundItem.findById(id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Found item not found'
            });
        }

        if (item.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this item'
            });
        }

        await FoundItem.delete(id);

        res.json({
            success: true,
            message: 'Found item deleted successfully'
        });
    } catch (error) {
        console.error('Delete found item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
