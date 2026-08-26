# Commitment Service Architecture

The service separates transport, domain policy, and persistence. Express supplies request correlation and structured error serialization. The domain service owns commitment scope validation, role gates, idempotency, and state transitions. The store writes a complete replacement document to a temporary file before atomic rename, so a valid commit cannot expose a partially written JSON document.

| State | Required role | Next state |
| --- | --- | --- |
| submitted | commitment_profile_analyst | commitment_profiled |
| commitment_profiled | commitment_availability_verifier | availability_verified |
| availability_verified | commitment_capacity_validator | capacity_validated |
| capacity_validated | commitment_authority | commitment_authorized |
| commitment_authorized | commitment_registrar | commitment_released |

The service never mutates a review before scope, actor, request identifier, and current state checks pass.
