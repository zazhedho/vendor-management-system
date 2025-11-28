-- Events/Pitching table for tender/event management
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    terms_file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft',
    created_by_user_id UUID NOT NULL,
    winner_vendor_id UUID,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP,
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(50),

    CONSTRAINT fk_events_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_winner FOREIGN KEY (winner_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
    CONSTRAINT chk_event_status CHECK (status IN ('draft', 'open', 'closed', 'completed', 'cancelled'))
);

-- Event submissions from vendors (pitch deck, proposals)
CREATE TABLE IF NOT EXISTS event_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    pitch_file_path VARCHAR(500),
    proposal_details TEXT,
    additional_materials TEXT,
    score DECIMAL(5,2),
    comments TEXT,
    is_shortlisted BOOLEAN DEFAULT FALSE,
    is_winner BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP,
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(50),

    CONSTRAINT fk_submissions_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT uq_event_vendor UNIQUE (event_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_creator ON events(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_event ON event_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_submissions_vendor ON event_submissions(vendor_id);
