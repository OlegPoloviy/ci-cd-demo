# Security Baseline

This document is a short security review of the current project, based on OWASP ASVS-style categories. The goal is not to rewrite the full checklist, but to convert it into an engineering baseline and a practical backlog.

Project scope reviewed:

- `orders-service` as the main HTTP/GraphQL/WebSocket entry point
- `payments-service` as the internal gRPC payment component
- local/deploy Docker Compose configuration and environment handling

## Risky Surface Areas

| Surface area | Risk | Control before | What I added | Evidence | Residual risk |
| --- | --- | --- | --- | --- | --- |
| `POST /api/auth/login` | brute force / credential stuffing | JWT auth only | `strict` throttling + audit for login success/failure | `security-evidence/rate-limit.txt`, `security-evidence/audit-log-example.md` | no captcha / anomaly detection |
| `PATCH /api/v2/user/:id/role` | privilege escalation / unauthorized role changes | role metadata + guard | `strict` throttling + structured audit log | `security-evidence/audit-log-example.md` | broader admin workflow review still needed |
| `POST /api/files/presign` and `POST /api/files/complete` | abuse of privileged file operations | admin JWT + role guard | `strict` throttling + structured audit events | code path in `FilesService`, headers/rate-limit evidence in `security-evidence/` | no malware scanning / content allowlist yet |
| GraphQL order queries | expensive query abuse / scraping | DTO and service validation | GraphQL throttling via `GqlThrottlerGuard` + `StrictThrottle()` | code config in `orders-service` + rate-limit headers | introspection/graphiql still enabled |
| Public HTTP API surface | missing browser/API hardening | validation pipe | `helmet()` baseline headers + strict CORS allowlist | `security-evidence/headers.txt` | reverse proxy / trust proxy handling still limited |

## 1. Authentication / Session / JWT

### What I already have

- JWT-based authentication is implemented in `orders-service`.
- Access tokens are signed with `JWT_SECRET` and have configurable expiration via `JWT_EXPIRES_IN`.
- Passwords are verified with `bcrypt`.
- `JwtStrategy` validates bearer tokens and rejects expired tokens.
- Swagger documents bearer authentication for protected endpoints.
- WebSocket connections in the delivery gateway also verify a JWT during connection setup.
- Login throttling is enabled on `/auth/login`.

### Remaining risk

- The project currently uses access tokens only; there is no refresh-token flow, logout, token revocation, or session invalidation.
- JWT validation is mostly signature + expiration based; there is no issuer/audience validation.
- Some endpoints are still weakly protected or not protected at all, so authentication exists but is not applied consistently.
- Brute-force protection is improved with throttling, but there is still no captcha, device reputation, or anomaly detection.

### Backlog / TODO

- Add refresh tokens or another controlled session renewal mechanism.
- Add logout / token revocation strategy for compromised tokens.
- Consider stricter JWT claims validation (`iss`, `aud`, key rotation plan).
- Review every controller and make authentication requirements explicit.

## 2. Access Control / Roles / Scopes

### What I already have

- Role metadata and `UserRoleGuard` are implemented.
- JWT payloads already contain `roles` and `scopes`.
- Some sensitive endpoints are protected with `JwtAuthGuard` and role checks, for example file upload flows and role assignment.
- WebSocket order subscription logic includes ownership/role-based checks for who can subscribe to order updates.

### Remaining risk

- Authorization is inconsistent across the API surface.
- Several endpoints in `orders.controller.ts` are currently open, including order listing, order creation, order lookup, payment-status lookup, and courier assignment.

### Backlog / TODO

- Protect order endpoints with explicit auth + authorization rules.
- Define who can create/read/update orders: customer vs admin vs courier vs support.
- Either implement scope-based authorization or remove unused scope fields until needed.
- Add authorization tests for both allowed and denied cases.

## 3. Secrets Management

### What I already have

- Configuration is externalized through environment variables.
- `.env.example` documents required secrets and operational config.
- CI/CD/deploy flow is designed around environment-specific variables and GitHub Environment variables and Secrets.
- JWT, DB, RabbitMQ, and object storage credentials are not hardcoded in service source files.

### Remaining risk

- Example/deploy env files use weak placeholder defaults such as `guest`, `postgres`, `minioadmin`, and `some-strong-secret`.
- There is no visible secret rotation policy, secret scanning gate, or separation between low-risk config and true secrets.
- Internal services still rely on long-lived shared secrets from env vars.

### Backlog / TODO

- Replace weak example values with clearly fake but non-default placeholders.
- Add secret scanning in CI.
- Define rotation rules for JWT secret, DB passwords, RabbitMQ credentials, and storage credentials.
- Consider a dedicated secret manager for non-local environments.

### What I've done

- Changed the example .env variables to safer and more general
- Removed hardcoded envs in payments-service main file, used configService with getOrThrow method instead of process.env and hardcoded vars

## 4. Transport Security / TLS

### What I already have

- Internal databases are placed on an internal Docker network.
- Service-to-service communication is separated from the public-facing network in Compose.
- The app is structured so TLS termination can be placed in front of it later.
- `helmet()` is enabled on the HTTP service and baseline security headers are returned by the app.

### Remaining risk

- `orders-service` currently runs over plain HTTP in local/deploy Compose.
- `payments-service` gRPC transport is configured without TLS.
- MinIO and CloudFront-style file URLs can fall back to plain HTTP.
- RabbitMQ management and service ports are exposed in Compose.
- There is still no HTTPS redirect, secure-cookie flow, or mTLS for internal service calls.

### Backlog / TODO

- Terminate HTTPS in front of public HTTP endpoints.
- Add TLS for gRPC traffic if the service is deployed outside a fully trusted private boundary.
- Use HTTPS object-storage/view URLs in non-local environments.
- Review exposed infrastructure ports and close the ones that are not required.
- Document which environments are allowed to run without TLS and why.

## 5. Input Surface / Abuse Protection

### What we already have

- Global `ValidationPipe` is enabled
- DTOs use `class-validator` for login, order creation, and file-upload metadata.
- Order creation already uses an idempotency key, which reduces duplicate processing risk.
- File upload flow is split into presign + complete steps instead of direct binary upload through the API.

### Remaining risk

- File metadata is validated, but there is no strong server-side allowlist for file type, extension, size ceilings, malware scanning, or content verification.
- Open order/user endpoints increase the abuse surface even if DTO validation exists.

### Backlog / TODO

- Add file upload allowlists and maximum file-size enforcement on the server side.
- Consider malware scanning or async quarantine for uploaded files.
- Add request size/body limits where appropriate.

### What I've done

- Added strict and default rate limiting
- Added strict login throttling for `/auth/login`
- Added stricter throttling for risky REST/GraphQL/WebSocket actions
- Added security headers with the help of helmet
- Added strict CORS policy

## 6. Logging / Auditability

### What we already have

- Global exception filtering logs warnings/errors.
- The service has request-context support and a request ID middleware.
- Errors are sanitized for 500 responses so raw internals are not returned to clients.
- Some business events are logged, for example payment authorization and order-processing flow.
- Request ID is now wired globally and propagated into request context.
- Structured audit logging is implemented for login success/failure, role changes, and privileged file-upload actions.

### Remaining risk

- Logging is mostly operational, not audit-grade.
- There is no visible retention, alerting, or tamper-resistance strategy.

### Backlog / TODO

- Add alerts for repeated auth failures and suspicious access patterns.
- Review logs to ensure secrets and tokens are never written.

### What I've done

- Wired `requestId`/`correlationId` into the global request context.
- Added a structured audit event schema with actor, action, target, outcome, timestamp, request ID, IP, and user agent.
- Added dedicated audit events for:
  - login success / failure
  - role changes
  - privileged file upload actions
