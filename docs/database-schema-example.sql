-- Recommended Database Schema for QC Records
-- Single table approach - BEST PRACTICE for multi-user systems

CREATE TABLE qc_records (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id VARCHAR(50) NOT NULL,  -- Identifier for the user (username, email, or numeric ID)
    partscode NVARCHAR(100) NOT NULL,
    supplier NVARCHAR(100) NOT NULL,
    po_number NVARCHAR(50),
    delivery_date DATE,
    inspection_date DATE,
    delivery_quantity INT,
    return_quantity INT,
    lot_number NVARCHAR(50),
    lot_quantity INT,
    inspector NVARCHAR(100),
    sample_size INT,
    defective_count INT,
    judgement NVARCHAR(50),
    strictness_adjustment NVARCHAR(50),
    selection_a BIT DEFAULT 0,
    selection_b BIT DEFAULT 0,
    selection_c BIT DEFAULT 0,
    selection_d BIT DEFAULT 0,
    destination NVARCHAR(100),
    group_leader_confirmation NVARCHAR(100),
    quality_summary NVARCHAR(500),
    remarks NVARCHAR(1000),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_id ON qc_records(user_id);
CREATE INDEX idx_created_at ON qc_records(created_at);
CREATE INDEX idx_partscode ON qc_records(partscode);
CREATE INDEX idx_inspection_date ON qc_records(inspection_date);

-- Example: Fetch records for a specific user
-- SELECT * FROM qc_records WHERE user_id = 'john.doe' ORDER BY created_at DESC;

-- Example: Fetch records for all users (admin view)
-- SELECT * FROM qc_records ORDER BY created_at DESC;

-- Example: Count records per user
-- SELECT user_id, COUNT(*) as record_count FROM qc_records GROUP BY user_id;



