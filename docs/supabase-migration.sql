-- Supabase Migration: Create qc_records table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS qc_records (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    partscode VARCHAR(100) NOT NULL,
    supplier VARCHAR(100) NOT NULL,
    po_number VARCHAR(50),
    delivery_date DATE,
    inspection_date DATE,
    delivery_quantity INTEGER,
    return_quantity INTEGER,
    lot_number VARCHAR(50),
    lot_quantity INTEGER,
    inspector VARCHAR(100),
    sample_size INTEGER,
    defective_count INTEGER,
    judgement VARCHAR(50),
    strictness_adjustment VARCHAR(50),
    selection_a BOOLEAN DEFAULT FALSE,
    selection_b BOOLEAN DEFAULT FALSE,
    selection_c BOOLEAN DEFAULT FALSE,
    selection_d BOOLEAN DEFAULT FALSE,
    destination VARCHAR(100),
    group_leader_confirmation VARCHAR(100),
    quality_summary TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_qc_records_user_id ON qc_records(user_id);
CREATE INDEX IF NOT EXISTS idx_qc_records_created_at ON qc_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qc_records_partscode ON qc_records(partscode);
CREATE INDEX IF NOT EXISTS idx_qc_records_inspection_date ON qc_records(inspection_date DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_qc_records_updated_at 
    BEFORE UPDATE ON qc_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE qc_records IS 'Quality control inspection records';
COMMENT ON COLUMN qc_records.user_id IS 'Identifier for the user who created the record';
COMMENT ON COLUMN qc_records.partscode IS 'Part code (required)';
COMMENT ON COLUMN qc_records.supplier IS 'Supplier name (required)';


