/**
 * Standardized API Response Handler
 * Provides consistent response format across the entire application
 */

/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code (default: 200)
 * @param {String} message - Success message
 * @param {*} data - Data to send in response
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
    const response = {
        success: true,
        message: message,
        timestamp: new Date().toISOString()
    };

    if (data !== null) {
        response.data = data;
    }

    if (meta !== null) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {String} message - Error message
 * @param {*} errors - Additional error details
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
    const response = {
        success: false,
        message: message,
        timestamp: new Date().toISOString()
    };

    if (errors !== null) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Created Response (201)
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {*} data - Created data
 */
const createdResponse = (res, message = 'Resource created successfully', data = null) => {
    return successResponse(res, 201, message, data);
};

/**
 * Bad Request Response (400)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {*} errors - Validation errors
 */
const badRequestResponse = (res, message = 'Bad Request', errors = null) => {
    return errorResponse(res, 400, message, errors);
};

/**
 * Unauthorized Response (401)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const unauthorizedResponse = (res, message = 'Unauthorized') => {
    return errorResponse(res, 401, message);
};

/**
 * Forbidden Response (403)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const forbiddenResponse = (res, message = 'Forbidden') => {
    return errorResponse(res, 403, message);
};

/**
 * Not Found Response (404)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const notFoundResponse = (res, message = 'Resource not found') => {
    return errorResponse(res, 404, message);
};

/**
 * Validation Error Response (422)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {*} errors - Validation errors
 */
const validationErrorResponse = (res, message = 'Validation failed', errors = null) => {
    return errorResponse(res, 422, message, errors);
};

/**
 * Pagination Response Helper
 * @param {Object} res - Express response object
 * @param {*} data - Data array
 * @param {Number} total - Total items count
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {String} message - Success message
 */
const paginatedResponse = (res, data, total, page = 1, limit = 10, message = 'Success') => {
    const totalPages = Math.ceil(total / limit);
    
    const meta = {
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(total),
            totalPages: parseInt(totalPages),
            hasNext: parseInt(page) < parseInt(totalPages),
            hasPrev: parseInt(page) > 1
        }
    };

    return successResponse(res, 200, message, data, meta);
};

/**
 * Login Response
 * @param {Object} res - Express response object
 * @param {String} token - JWT token
 * @param {Object} user - User data
 * @param {String} message - Success message
 */
const loginResponse = (res, token, user, message = 'Login successful') => {
    return successResponse(res, 200, message, {
        token: token,
        user: user
    });
};

/**
 * Logout Response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 */
const logoutResponse = (res, message = 'Logout successful') => {
    return successResponse(res, 200, message);
};

/**
 * Deleted Response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 */
const deletedResponse = (res, message = 'Resource deleted successfully') => {
    return successResponse(res, 200, message);
};

/**
 * Updated Response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {*} data - Updated data
 */
const updatedResponse = (res, message = 'Resource updated successfully', data = null) => {
    return successResponse(res, 200, message, data);
};

module.exports = {
    // Base responses
    successResponse,
    errorResponse,
    
    // Specific responses
    createdResponse,
    badRequestResponse,
    unauthorizedResponse,
    forbiddenResponse,
    notFoundResponse,
    validationErrorResponse,
    
    // Helper responses
    paginatedResponse,
    loginResponse,
    logoutResponse,
    deletedResponse,
    updatedResponse
};