-- ================================
-- evaluations table
-- ================================
CREATE TABLE IF NOT EXISTS evaluations (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    evaluator_user_id UUID NOT NULL,
    overall_rating DECIMAL(3,2) NULL,
    comments TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(36) NULL,

    CONSTRAINT fk_evaluations_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_evaluations_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES vendors(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_evaluations_evaluator
        FOREIGN KEY (evaluator_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_evaluations_event_id
    ON evaluations(event_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_vendor_id
    ON evaluations(vendor_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_user_id
    ON evaluations(evaluator_user_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_deleted_at
    ON evaluations(deleted_at);


-- ================================
-- updated_at trigger
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'trg_evaluations_set_updated_at'
          AND c.relname = 'evaluations'
    ) THEN
        CREATE TRIGGER trg_evaluations_set_updated_at
            BEFORE UPDATE ON evaluations
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    END IF;
END$$;


-- ================================
-- evaluation_photos table
-- ================================
CREATE TABLE IF NOT EXISTS evaluation_photos (
    id VARCHAR(36) PRIMARY KEY,
    evaluation_id VARCHAR(36) NOT NULL,
    photo_url TEXT NOT NULL,
    review TEXT NULL,
    rating DECIMAL(3,2) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_evaluation_photos_evaluation
        FOREIGN KEY (evaluation_id)
        REFERENCES evaluations(id)
        ON DELETE CASCADE
);


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_evaluation_photos_evaluation_id
    ON evaluation_photos(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_photos_deleted_at
    ON evaluation_photos(deleted_at);
