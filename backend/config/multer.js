const multer = require('multer');
const path = require('path');
const fs = require('fs');

// =============================================
// ENSURE UPLOAD DIRECTORIES EXIST
// =============================================
const dirs = ['uploads/lost-items', 'uploads/found-items', 'uploads/proofs'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// =============================================
// STORAGE CONFIGURATION
// =============================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'uploads/';
        if (file.fieldname === 'image' || file.fieldname === 'lost_image') {
            folder += 'lost-items';
        } else if (file.fieldname === 'found_image') {
            folder += 'found-items';
        } else if (file.fieldname === 'proof_image' || file.fieldname === 'proof') {
            folder += 'proofs';
        } else {
            folder += 'lost-items'; // default
        }
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// =============================================
// FILE FILTER - ONLY ALLOW IMAGES
// =============================================
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
};

// =============================================
// MULTER CONFIGURATION
// =============================================
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    },
    fileFilter: fileFilter
});

// =============================================
// EXPORT MIDDLEWARES
// =============================================
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

// =============================================
// ERROR HANDLER
// =============================================
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name. Expected: ' + err.field
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next();
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    uploadFields,
    handleMulterError
};