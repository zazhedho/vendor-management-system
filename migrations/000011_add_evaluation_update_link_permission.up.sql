-- ================================
-- Add evaluation:update_link permission for vendors
-- ================================
-- Allows vendors to update their Google Drive link in evaluations

-- Insert new permission (idempotent)
INSERT INTO permissions (id, name, display_name, resource, action)
SELECT gen_random_uuid(), 'update_evaluation_link', 'Update Evaluation Drive Link', 'evaluation', 'update_link'
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE name = 'update_evaluation_link'
);

-- Assign to vendor role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'vendor'
AND p.name = 'update_evaluation_link'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Add comment
COMMENT ON COLUMN evaluations.google_drive_url IS 'Optional Google Drive link for additional photos beyond the 5 photo limit. Vendor can update via evaluation:update_link permission';
