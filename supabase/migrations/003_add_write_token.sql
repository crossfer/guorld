-- ============================================================
-- 003_add_write_token.sql
-- Write token — only physical coin holders can add stories
-- ============================================================

ALTER TABLE coins ADD COLUMN write_token text UNIQUE;

UPDATE coins
SET write_token = encode(gen_random_bytes(8), 'hex')
WHERE write_token IS NULL;

ALTER TABLE coins ALTER COLUMN write_token SET NOT NULL;
