-- Persistent local accounts; passwords are PBKDF2 hashes.
BEGIN;

CREATE TABLE IF NOT EXISTS users (
	id VARCHAR(36) NOT NULL,
	email VARCHAR(254) NOT NULL,
	password_hash VARCHAR(300) NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id)
)

;
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);
COMMIT;
