-- ================================
-- ENUM event_status
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'event_status'
    ) THEN
        CREATE TYPE event_status AS ENUM ('draft', 'open', 'closed', 'completed', 'cancelled');
    END IF;
END$$;


-- ================================
-- events table
-- ================================
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    status event_status NOT NULL DEFAULT 'draft',
    winner_vendor_id VARCHAR(36) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(36) NULL,

    CONSTRAINT fk_events_winner
        FOREIGN KEY (winner_vendor_id)
        REFERENCES vendors(id)
        ON DELETE SET NULL
);


-- ================================
-- Column comments
-- ================================
COMMENT ON COLUMN events.status IS 'draft, open, closed, completed, cancelled';


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_events_status
    ON events(status);

CREATE INDEX IF NOT EXISTS idx_events_start_date
    ON events(start_date);

CREATE INDEX IF NOT EXISTS idx_events_deleted_at
    ON events(deleted_at);


-- ================================
-- updated_at trigger
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'trg_events_set_updated_at'
          AND c.relname = 'events'
    ) THEN
        CREATE TRIGGER trg_events_set_updated_at
            BEFORE UPDATE ON events
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    END IF;
END$$;


-- ================================
-- event_files table
-- ================================
CREATE TABLE IF NOT EXISTS event_files (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    caption TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_event_files_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);


-- ================================
-- Column comments
-- ================================
COMMENT ON COLUMN event_files.file_type IS 'image, document, terms';


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_event_files_event_id
    ON event_files(event_id);

CREATE INDEX IF NOT EXISTS idx_event_files_file_type
    ON event_files(file_type);

CREATE INDEX IF NOT EXISTS idx_event_files_deleted_at
    ON event_files(deleted_at);


-- ================================
-- event_submissions table
-- ================================
CREATE TABLE IF NOT EXISTS event_submissions (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    vendor_id VARCHAR(36) NOT NULL,
    proposal_details TEXT NULL,
    additional_materials TEXT NULL,
    score DECIMAL(5,2) NULL,
    comments TEXT NULL,
    is_shortlisted BOOLEAN NOT NULL DEFAULT FALSE,
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(36) NULL,

    CONSTRAINT fk_event_submissions_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_event_submissions_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES vendors(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_event_vendor UNIQUE (event_id, vendor_id)
);


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_event_submissions_event_id
    ON event_submissions(event_id);

CREATE INDEX IF NOT EXISTS idx_event_submissions_vendor_id
    ON event_submissions(vendor_id);

CREATE INDEX IF NOT EXISTS idx_event_submissions_is_shortlisted
    ON event_submissions(is_shortlisted);

CREATE INDEX IF NOT EXISTS idx_event_submissions_is_winner
    ON event_submissions(is_winner);

CREATE INDEX IF NOT EXISTS idx_event_submissions_deleted_at
    ON event_submissions(deleted_at);


-- ================================
-- updated_at trigger
-- ================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'trg_event_submissions_set_updated_at'
          AND c.relname = 'event_submissions'
    ) THEN
        CREATE TRIGGER trg_event_submissions_set_updated_at
            BEFORE UPDATE ON event_submissions
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
    END IF;
END$$;


-- ================================
-- event_submission_files table
-- ================================
CREATE TABLE IF NOT EXISTS event_submission_files (
    id VARCHAR(36) PRIMARY KEY,
    event_submission_id VARCHAR(36) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    caption TEXT NULL,
    file_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_event_submission_files_submission
        FOREIGN KEY (event_submission_id)
        REFERENCES event_submissions(id)
        ON DELETE CASCADE
);


-- ================================
-- Column comments
-- ================================
COMMENT ON COLUMN event_submission_files.file_type IS 'pitch, proposal, supporting_doc';


-- ================================
-- Indexes
-- ================================
CREATE INDEX IF NOT EXISTS idx_event_submission_files_event_submission_id
    ON event_submission_files(event_submission_id);

CREATE INDEX IF NOT EXISTS idx_event_submission_files_file_type
    ON event_submission_files(file_type);

CREATE INDEX IF NOT EXISTS idx_event_submission_files_file_order
    ON event_submission_files(file_order);

CREATE INDEX IF NOT EXISTS idx_event_submission_files_deleted_at
    ON event_submission_files(deleted_at);
