ALTER TABLE users ADD COLUMN ra TEXT CHECK (ra IS NULL OR (length(ra) BETWEEN 1 AND 32 AND ra NOT GLOB '*[^0-9]*'));
ALTER TABLE users ADD COLUMN deleted_at TEXT;
ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0 CHECK(session_version >= 0);
CREATE UNIQUE INDEX users_ra_unique ON users(ra) WHERE ra IS NOT NULL;
UPDATE users SET ra='180386' WHERE lower(trim(email))='montivallucas@icloud.com' AND role='admin' AND ra IS NULL;
