-- Migration: 011_create_partners_table.sql
-- Description: Minimal table for Batch 2 testing of partnership and investor intake

CREATE TABLE IF NOT EXISTS partners (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_type VARCHAR(50) NOT NULL,
    name             VARCHAR(128) NOT NULL,
    company_name     VARCHAR(128) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(50) NOT NULL,
    whatsapp         VARCHAR(50),
    sector           VARCHAR(100),
    investment_type  VARCHAR(100),
    enquiry          VARCHAR(2000),
    status           VARCHAR(30) NOT NULL DEFAULT 'submitted',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_created ON partners(created_at DESC);
