# User seeding controls

Run `npm run seed:users` only with an explicitly supplied `SEED_PASSWORD`. The seed command rejects a missing or blank value before connecting to MongoDB.

Existing seeded-user passwords are preserved by default. Set `RESET_SEEDED_PASSWORDS=true` only for an intentional local reset. Production seeding remains blocked unless `ALLOW_PRODUCTION_SEED=true` is also explicitly set.

The seed workflow must never print the supplied credential. `User` hashes `passwordHash` in its pre-save hook when a seeded user is created or when an explicit reset changes that field. Focused tests verify that creation and authorized reset remain verifiable through `comparePassword`, while an ordinary rerun preserves the existing password.

## Repository-visible risk audit

Historical repository evidence predating this remediation contains a seeded credential value. This change does not remove history or rotate any credential. Redacted evidence locations:

- `server/scripts/seedUsers.js` at audited base commit `ecff7e6661f5543ba7112b759d1fa69101ef3944`.
- Repository commit and workflow evidence referenced by Architect run `2026-07-23-002`.

Treat any credential ever committed or emitted by automation as exposed. Rotation, provider-secret access, MongoDB access, workflow modification, and history rewriting require separate authorization and are outside this remediation.
