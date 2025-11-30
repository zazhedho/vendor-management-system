-- ================================
-- evaluations table
-- ================================
-- Vendor creates evaluation after winning and completing event
-- Client (event creator) reviews and rates the photos
CREATE TABLE IF NOT EXISTS evaluations (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    evaluator_user_id VARCHAR(36) NOT NULL,  -- Client user ID (event creator) who will review
    overall_rating DECIMAL(3,2) NULL,  -- Auto-calculated average from photo ratings (1-5 stars)
    comments TEXT NULL,  -- Vendor's comments about the event

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,  -- Vendor user ID
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
        ON DELETE CASCADE,
    CONSTRAINT chk_evaluations_rating
        CHECK (overall_rating IS NULL OR (overall_rating >= 1 AND overall_rating <= 5)),
    CONSTRAINT unique_evaluation_per_event_vendor
        UNIQUE (event_id, vendor_id)
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
-- Vendor uploads photos with captions (max 5 per evaluation)
-- Client reviews and rates each photo individually (1-5 stars)
CREATE TABLE IF NOT EXISTS evaluation_photos (
    id VARCHAR(36) PRIMARY KEY,
    evaluation_id VARCHAR(36) NOT NULL,
    photo_url TEXT NOT NULL,
    caption VARCHAR(500) NULL,  -- Vendor's caption for the photo
    review TEXT NULL,  -- Client's review of the photo
    rating DECIMAL(3,2) NULL,  -- Client's rating (1-5 stars)
    reviewed_by VARCHAR(36) NULL,  -- Client user ID who reviewed this photo
    reviewed_at TIMESTAMP NULL,  -- When the photo was reviewed

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_evaluation_photos_evaluation
        FOREIGN KEY (evaluation_id)
        REFERENCES evaluations(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_photos_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_evaluation_photos_rating
        CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_evaluation_photos_evaluation_id
    ON evaluation_photos(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_photos_reviewed_by
    ON evaluation_photos(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_evaluation_photos_deleted_at
    ON evaluation_photos(deleted_at);


-- ================================
-- Comments for documentation
-- ================================
COMMENT ON TABLE evaluations IS 'Evaluations created by vendors for events they won and completed. Clients review and rate the vendor work.';
COMMENT ON COLUMN evaluations.evaluator_user_id IS 'Client user ID (event creator) who will review the evaluation photos';
COMMENT ON COLUMN evaluations.overall_rating IS 'Auto-calculated average from all photo ratings (1-5 stars)';
COMMENT ON COLUMN evaluations.comments IS 'Vendor comments about their work on the event';

COMMENT ON TABLE evaluation_photos IS 'Photos uploaded by vendors with captions. Clients review and rate each photo individually.';
COMMENT ON COLUMN evaluation_photos.caption IS 'Vendor caption describing the photo';
COMMENT ON COLUMN evaluation_photos.review IS 'Client review of the photo';
COMMENT ON COLUMN evaluation_photos.rating IS 'Client rating of the photo (1-5 stars)';
COMMENT ON COLUMN evaluation_photos.reviewed_by IS 'Client user ID who reviewed this photo';
COMMENT ON COLUMN evaluation_photos.reviewed_at IS 'Timestamp when the photo was reviewed by client';
