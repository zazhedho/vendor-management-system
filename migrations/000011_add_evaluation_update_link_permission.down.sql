-- ================================
-- Remove evaluation:update_link permission
-- ================================

-- Remove from role_permissions
DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE name = 'update_evaluation_link'
);

-- Delete permission
DELETE FROM permissions WHERE name = 'update_evaluation_link';
