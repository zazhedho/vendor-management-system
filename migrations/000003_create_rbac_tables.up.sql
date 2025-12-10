-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    parent_id UUID,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- Create role_menus junction table
CREATE TABLE IF NOT EXISTS role_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    menu_item_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    UNIQUE(role_id, menu_item_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(order_index);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_menus_role_id ON role_menus(role_id);
CREATE INDEX IF NOT EXISTS idx_role_menus_menu_item_id ON role_menus(menu_item_id);

-- Add foreign key to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_users_role'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END$$;
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Insert system roles
INSERT INTO roles (id, name, display_name, description, is_system) VALUES
    (gen_random_uuid(), 'superadmin', 'Super Administrator', 'Full system access with highest privileges', TRUE),
    (gen_random_uuid(), 'admin', 'Administrator', 'Full system access', TRUE),
    (gen_random_uuid(), 'client', 'Client', 'Client access for Manager/SPV to monitor vendor performance and evaluate events', TRUE),
    (gen_random_uuid(), 'vendor', 'Vendor', 'Vendor access to manage profile and submissions', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert menu items
INSERT INTO menu_items (id, name, display_name, path, icon, order_index) VALUES
    (gen_random_uuid(), 'dashboard', 'Dashboard', '/dashboard', 'bi-speedometer2', 1),
    (gen_random_uuid(), 'profile', 'Profile', '/profile', 'bi-person-circle', 2),
    (gen_random_uuid(), 'vendor_profile', 'Vendor Profile', '/vendor/profile', 'bi-building', 3),
    (gen_random_uuid(), 'vendor_submissions', 'Submissions', '/vendor/submissions', 'bi-file-earmark-text', 4),
    (gen_random_uuid(), 'events', 'Pitching Events', '/events', 'bi-calendar-event', 5),
    (gen_random_uuid(), 'evaluations', 'Evaluations', '/evaluations', 'bi-star', 6),
    (gen_random_uuid(), 'payments', 'Payments', '/payments', 'bi-credit-card', 7),
    (gen_random_uuid(), 'users', 'Users', '/users', 'bi-people', 900),
    (gen_random_uuid(), 'roles', 'Roles', '/roles', 'bi-shield-lock', 901),
    (gen_random_uuid(), 'menus', 'Menus', '/menus', 'bi-list-ul', 902)
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (id, name, display_name, resource, action) VALUES
    -- Dashboard permissions
    (gen_random_uuid(), 'view_dashboard', 'View Dashboard', 'dashboard', 'view'),

    -- User permissions
    (gen_random_uuid(), 'list_users', 'List Users', 'users', 'list'),
    (gen_random_uuid(), 'view_users', 'View User Detail', 'users', 'view'),
    (gen_random_uuid(), 'create_users', 'Create Users', 'users', 'create'),
    (gen_random_uuid(), 'update_users', 'Update Users', 'users', 'update'),
    (gen_random_uuid(), 'delete_users', 'Delete Users', 'users', 'delete'),

    -- Role permissions
    (gen_random_uuid(), 'list_roles', 'List Roles', 'roles', 'list'),
    (gen_random_uuid(), 'view_roles', 'View Role Detail', 'roles', 'view'),
    (gen_random_uuid(), 'create_roles', 'Create Roles', 'roles', 'create'),
    (gen_random_uuid(), 'update_roles', 'Update Roles', 'roles', 'update'),
    (gen_random_uuid(), 'delete_roles', 'Delete Roles', 'roles', 'delete'),
    (gen_random_uuid(), 'assign_permissions', 'Assign Permissions', 'roles', 'assign_permissions'),
    (gen_random_uuid(), 'assign_menus', 'Assign Menus', 'roles', 'assign_menus'),

    -- Menu permissions
    (gen_random_uuid(), 'list_menus', 'List Menus', 'menus', 'list'),
    (gen_random_uuid(), 'view_menu', 'View Menu Detail', 'menus', 'view'),
    (gen_random_uuid(), 'create_menu', 'Create Menu', 'menus', 'create'),
    (gen_random_uuid(), 'update_menu', 'Update Menu', 'menus', 'update'),
    (gen_random_uuid(), 'delete_menu', 'Delete Menu', 'menus', 'delete'),

    -- Permission management permissions
    (gen_random_uuid(), 'list_permissions', 'List Permissions', 'permissions', 'list'),
    (gen_random_uuid(), 'view_permissions', 'View Permission Detail', 'permissions', 'view'),
    (gen_random_uuid(), 'create_permissions', 'Create Permissions', 'permissions', 'create'),
    (gen_random_uuid(), 'update_permissions', 'Update Permissions', 'permissions', 'update'),
    (gen_random_uuid(), 'delete_permissions', 'Delete Permissions', 'permissions', 'delete'),

    -- Profile permissions
    (gen_random_uuid(), 'view_profile', 'View Profile', 'profile', 'view'),
    (gen_random_uuid(), 'update_profile', 'Update Profile', 'profile', 'update'),

    -- Vendor permissions
    (gen_random_uuid(), 'list_vendors', 'List Vendors', 'vendor', 'list'),
    (gen_random_uuid(), 'view_vendor_profile', 'View Vendor Profile', 'vendor', 'view'),
    (gen_random_uuid(), 'update_vendor_profile', 'Update Vendor Profile', 'vendor', 'update'),
    (gen_random_uuid(), 'update_vendor_status', 'Update Vendor Status', 'vendor', 'update_status'),
    (gen_random_uuid(), 'view_vendor_submissions', 'View Vendor Submissions', 'vendor', 'view_submissions'),
    (gen_random_uuid(), 'create_vendor_submission', 'Create Vendor Submission', 'vendor', 'create_submission'),
    (gen_random_uuid(), 'delete_vendor', 'Delete Vendor', 'vendor', 'delete'),

    -- Event permissions
    (gen_random_uuid(), 'list_events', 'List Events', 'event', 'list'),
    (gen_random_uuid(), 'view_events', 'View Event Detail', 'event', 'view'),
    (gen_random_uuid(), 'create_event', 'Create Event', 'event', 'create'),
    (gen_random_uuid(), 'update_event', 'Update Event', 'event', 'update'),
    (gen_random_uuid(), 'delete_event', 'Delete Event', 'event', 'delete'),
    (gen_random_uuid(), 'list_submissions', 'List Event Submissions', 'event', 'list_submissions'),
    (gen_random_uuid(), 'view_submissions', 'View Event Submissions', 'event', 'view_submissions'),
    (gen_random_uuid(), 'score_submission', 'Score Event Submission', 'event', 'score'),
    (gen_random_uuid(), 'select_winner', 'Select Event Winner', 'event', 'select_winner'),
    (gen_random_uuid(), 'submit_pitch', 'Submit Pitch Deck', 'event', 'submit_pitch'),
    (gen_random_uuid(), 'view_my_submissions', 'View My Event Submissions', 'event', 'view_my_submissions'),

    -- Evaluation permissions
    (gen_random_uuid(), 'list_evaluations', 'List Evaluations', 'evaluation', 'list'),
    (gen_random_uuid(), 'view_evaluations', 'View Evaluation Detail', 'evaluation', 'view'),
    (gen_random_uuid(), 'create_evaluation', 'Create Evaluation', 'evaluation', 'create'),
    (gen_random_uuid(), 'update_evaluation', 'Update Evaluation', 'evaluation', 'update'),
    (gen_random_uuid(), 'delete_evaluation', 'Delete Evaluation', 'evaluation', 'delete'),
    (gen_random_uuid(), 'upload_evaluation_photo', 'Upload Evaluation Photo', 'evaluation', 'upload_photo'),
    (gen_random_uuid(), 'review_photo', 'Review Evaluation Photo', 'evaluation', 'review_photo'),

    -- Payment permissions
    (gen_random_uuid(), 'list_payments', 'List Payments', 'payment', 'list'),
    (gen_random_uuid(), 'view_payments', 'View Payment Detail', 'payment', 'view'),
    (gen_random_uuid(), 'create_payment', 'Create Payment', 'payment', 'create'),
    (gen_random_uuid(), 'update_payment', 'Update Payment', 'payment', 'update'),
    (gen_random_uuid(), 'delete_payment', 'Delete Payment', 'payment', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to superadmin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'superadmin'
ON CONFLICT DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign permissions to client role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'client'
AND p.name IN (
    'view_profile', 'update_profile', 'view_dashboard',
    'list_events', 'view_events', 'create_event', 'update_event',
    'list_submissions', 'view_submissions', 'score_submission', 'select_winner',
    'list_evaluations', 'view_evaluations', 'create_evaluation', 'update_evaluation', 'review_photo',
    'list_vendors', 'view_vendor_profile'
)
ON CONFLICT DO NOTHING;

-- Assign permissions to vendor role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'vendor'
AND p.name IN (
    'view_profile', 'update_profile', 'view_dashboard',
    'view_vendor_profile', 'update_vendor_profile', 'view_vendor_submissions', 'create_vendor_submission',
    'list_events', 'view_events', 'submit_pitch', 'view_my_submissions',
    'list_payments', 'view_payments',
    'upload_evaluation_photo', 'list_evaluations', 'view_evaluations'
)
ON CONFLICT DO NOTHING;

-- Assign all menus to superadmin role
INSERT INTO role_menus (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r
CROSS JOIN menu_items m
WHERE r.name = 'superadmin'
ON CONFLICT DO NOTHING;

-- Assign all menus to admin role
INSERT INTO role_menus (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r
CROSS JOIN menu_items m
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign menus to client role
INSERT INTO role_menus (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r
CROSS JOIN menu_items m
WHERE r.name = 'client'
AND m.name IN ('dashboard', 'profile', 'events', 'evaluations')
ON CONFLICT DO NOTHING;

-- Assign menus to vendor role
INSERT INTO role_menus (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r
CROSS JOIN menu_items m
WHERE r.name = 'vendor'
AND m.name IN ('dashboard', 'profile', 'vendor_profile', 'vendor_submissions', 'events', 'evaluations', 'payments')
ON CONFLICT DO NOTHING;
