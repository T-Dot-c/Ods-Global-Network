-- Migration: 010_create_support_requests_table.sql
-- Description: Minimal table for Batch 2 testing of customer support inquiries

CREATE TABLE IF NOT EXISTS support_requests (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference  VARCHAR(32) NOT NULL UNIQUE,
    name       VARCHAR(128) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    subject    VARCHAR(200) NOT NULL,
    message    TEXT NOT NULL,
    status     VARCHAR(30) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_created ON support_requests(created_at DESC);
