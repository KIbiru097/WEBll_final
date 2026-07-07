
-- Drop tables if they exist (correct order for foreign keys)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS found_items CASCADE;
DROP TABLE IF EXISTS lost_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- 1. USERS TABLE
-- =============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    phone VARCHAR(20),
    profile_pic VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. LOST ITEMS TABLE
-- =============================================
CREATE TABLE lost_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    location_lost VARCHAR(255) NOT NULL,
    date_lost DATE NOT NULL,
    image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'returned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. FOUND ITEMS TABLE
-- =============================================
CREATE TABLE found_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    location_found VARCHAR(255) NOT NULL,
    date_found DATE NOT NULL,
    image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'returned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. CLAIMS TABLE
-- =============================================

CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    claimant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL,
    item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('lost', 'found')),
    reason TEXT NOT NULL,
    brand VARCHAR(100),
    color VARCHAR(50),
    serial_number VARCHAR(100),
    unique_marks TEXT,
    proof_image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. ACTIVITY LOGS TABLE (For Logging)
-- =============================================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Lost items indexes
CREATE INDEX idx_lost_items_user ON lost_items(user_id);
CREATE INDEX idx_lost_items_status ON lost_items(status);
CREATE INDEX idx_lost_items_category ON lost_items(category);
CREATE INDEX idx_lost_items_location ON lost_items(location_lost);

-- Found items indexes
CREATE INDEX idx_found_items_user ON found_items(user_id);
CREATE INDEX idx_found_items_status ON found_items(status);
CREATE INDEX idx_found_items_category ON found_items(category);
CREATE INDEX idx_found_items_location ON found_items(location_found);

-- Claims indexes
CREATE INDEX idx_claims_claimant ON claims(claimant_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_item ON claims(item_id, item_type);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- =============================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lost_items_updated_at BEFORE UPDATE ON lost_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_found_items_updated_at BEFORE UPDATE ON found_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INSERT SAMPLE DATA (Optional - For Testing)
-- =============================================

-- Insert Admin User (password: admin123)
INSERT INTO users (full_name, email, password, role, phone) VALUES
('Admin User', 'admin@university.edu', '$2a$10$5iN9X.KqDkL.YNqkgm/HM.rXuPDV2DIZO9RnqTzSFjO/IY5Nn7l7O', 'admin', '+1234567899');

-- Insert Student Users (password: password123)
INSERT INTO users (full_name, email, password, role, phone) VALUES
('John Doe', 'john@university.edu', '$2a$10$5iN9X.KqDkL.YNqkgm/HM.rXuPDV2DIZO9RnqTzSFjO/IY5Nn7l7O', 'student', '+1234567890'),
('Jane Smith', 'jane@university.edu', '$2a$10$5iN9X.KqDkL.YNqkgm/HM.rXuPDV2DIZO9RnqTzSFjO/IY5Nn7l7O', 'student', '+1234567891');

-- Insert Lost Items
INSERT INTO lost_items (user_id, item_name, category, description, location_lost, date_lost, status) VALUES
(2, 'MacBook Pro', 'Electronics', 'Silver MacBook Pro with charger', 'Main Library - 3rd Floor', '2026-07-01', 'open'),
(3, 'Student ID Card', 'ID Cards', 'Blue student ID card with photo', 'Cafeteria - Food Court', '2026-07-02', 'open');

-- Insert Found Items
INSERT INTO found_items (user_id, item_name, category, description, location_found, date_found, status) VALUES
(3, 'MacBook Pro', 'Electronics', 'Silver MacBook Pro found on desk', 'Main Library - 3rd Floor', '2026-07-03', 'available'),
(2, 'Student ID Card', 'ID Cards', 'Blue ID card found near food court', 'Cafeteria - Food Court', '2026-07-03', 'available');

-- Insert Activity Logs
INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES
(1, 'LOGIN', 'Admin logged in', '192.168.1.1'),
(2, 'REPORT_LOST', 'Reported lost MacBook Pro', '192.168.1.2'),
(3, 'REPORT_FOUND', 'Reported found MacBook Pro', '192.168.1.3');

-- =============================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =============================================

-- View: Active Lost Items with User Details
CREATE VIEW active_lost_items AS
SELECT 
    li.*,
    u.full_name as reporter_name,
    u.email as reporter_email
FROM lost_items li
JOIN users u ON li.user_id = u.id
WHERE li.status != 'returned';

-- View: Active Found Items with User Details
CREATE VIEW active_found_items AS
SELECT 
    fi.*,
    u.full_name as reporter_name,
    u.email as reporter_email
FROM found_items fi
JOIN users u ON fi.user_id = u.id
WHERE fi.status != 'returned';

-- View: Pending Claims
CREATE VIEW pending_claims AS
SELECT 
    c.*,
    u.full_name as claimant_name,
    u.email as claimant_email,
    CASE 
        WHEN c.item_type = 'lost' THEN (SELECT item_name FROM lost_items WHERE id = c.item_id)
        WHEN c.item_type = 'found' THEN (SELECT item_name FROM found_items WHERE id = c.item_id)
    END as item_name
FROM claims c
JOIN users u ON c.claimant_id = u.id
WHERE c.status = 'pending';

-- View: Dashboard Statistics
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
    (SELECT COUNT(*) FROM lost_items) as total_lost,
    (SELECT COUNT(*) FROM lost_items WHERE status = 'open') as open_lost,
    (SELECT COUNT(*) FROM lost_items WHERE status = 'claimed') as claimed_lost,
    (SELECT COUNT(*) FROM lost_items WHERE status = 'returned') as returned_lost,
    (SELECT COUNT(*) FROM found_items) as total_found,
    (SELECT COUNT(*) FROM found_items WHERE status = 'available') as available_found,
    (SELECT COUNT(*) FROM found_items WHERE status = 'claimed') as claimed_found,
    (SELECT COUNT(*) FROM found_items WHERE status = 'returned') as returned_found,
    (SELECT COUNT(*) FROM claims) as total_claims,
    (SELECT COUNT(*) FROM claims WHERE status = 'pending') as pending_claims,
    (SELECT COUNT(*) FROM claims WHERE status = 'approved') as approved_claims,
    (SELECT COUNT(*) FROM claims WHERE status = 'rejected') as rejected_claims;

-- =============================================
-- END OF DATABASE SCHEMA
-- =============================================

-- Display confirmation
SELECT '✅ Database schema created successfully!' as message;
SELECT '📊 Tables created: users, lost_items, found_items, claims, activity_logs' as tables;
SELECT '👁️ Views created: active_lost_items, active_found_items, pending_claims, dashboard_stats' as views;



ALTER TABLE users 
ADD COLUMN reset_password_token VARCHAR(255),
ADD COLUMN reset_password_expires TIMESTAMP;


-- Add to your existing users table
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;


select * from users



-- Add to your database schema
CREATE TABLE password_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_password_history_user ON password_history(user_id);

select * from found_items 




