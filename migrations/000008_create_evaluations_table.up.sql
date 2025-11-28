-- Vendor performance evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    vendor_id UUID NOT NULL,
    evaluator_user_id UUID NOT NULL,
    overall_rating DECIMAL(3,2),
    comments TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP,
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(50),

    CONSTRAINT fk_evaluations_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluations_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluations_evaluator FOREIGN KEY (evaluator_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_overall_rating CHECK (overall_rating >= 0 AND overall_rating <= 5)
);

-- Evaluation photos (max 5 per evaluation, max 2MB each)
CREATE TABLE IF NOT EXISTS evaluation_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL,
    photo_path VARCHAR(500) NOT NULL,
    review TEXT,
    rating DECIMAL(3,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_at TIMESTAMP,
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(50),

    CONSTRAINT fk_photos_evaluation FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
    CONSTRAINT chk_photo_rating CHECK (rating >= 0 AND rating <= 5)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_event ON evaluations(event_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_vendor ON evaluations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_user_id);
CREATE INDEX IF NOT EXISTS idx_photos_evaluation ON evaluation_photos(evaluation_id);
