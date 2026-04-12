# Security Baseline

This document is a short security review of the current project, based on OWASP ASVS-style categories. The goal is not to rewrite the full checklist, but to convert it into an engineering baseline and a practical backlog.

Project scope reviewed:

- `orders-service` as the main HTTP/GraphQL/WebSocket entry point
- `payments-service` as the internal gRPC payment component
- local/deploy Docker Compose configuration and environment handling

## 1. Authentication / Session / JWT

### What I already have

- JWT-based authentication is implemented in `orders-service`.
- Access tokens are signed with `JWT_SECRET` and have configurable expiration via `JWT_EXPIRES_IN`.
- Passwords are verified with `bcrypt`.
- `JwtStrategy` validates bearer tokens and rejects expired tokens.
- Swagger documents bearer authentication for protected endpoints.
- WebSocket connections in the delivery gateway also verify a JWT during connection setup.

### Remaining risk

- The project currently uses access tokens only; there is no refresh-token flow, logout, token revocation, or session invalidation.
- JWT validation is mostly signature + expiration based; there is no issuer/audience validation.
- Some endpoints are still weakly protected or not protected at all, so authentication exists but is not applied consistently.
- Login abuse protection is not visible yet, so brute-force attempts remain a realistic risk.

### Backlog / TODO

- Add refresh tokens or another controlled session renewal mechanism.
- Add logout / token revocation strategy for compromised tokens.
- Add rate limiting or login throttling for `/auth/login`.
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

- Replace `TestGuard` with real JWT validation or remove the old v1 route set.
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

### Remaining risk

- `orders-service` currently runs over plain HTTP in local/deploy Compose.
- `payments-service` gRPC transport is configured without TLS.
- MinIO and CloudFront-style file URLs can fall back to plain HTTP.
- RabbitMQ management and service ports are exposed in Compose.
- There is no evidence of HSTS, secure cookies, HTTPS redirect, or mTLS for internal service calls.

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

- There is no visible global rate limiting, anti-automation control, or abuse throttling.
- CORS is enabled broadly (`cors: true`) rather than being restricted to known origins.
- File metadata is validated, but there is no strong server-side allowlist for file type, extension, size ceilings, malware scanning, or content verification.
- WebSocket events do not appear to have message rate controls.
- Open order/user endpoints increase the abuse surface even if DTO validation exists.

### Backlog / TODO

- Add rate limiting for login, public APIs, and WebSocket message flows.
- Restrict CORS to approved origins by environment.
- Add file upload allowlists and maximum file-size enforcement on the server side.
- Consider malware scanning or async quarantine for uploaded files.
- Add request size/body limits where appropriate.

## 6. Logging / Auditability

### What we already have

- Global exception filtering logs warnings/errors.
- The service has request-context support and a request ID middleware.
- Errors are sanitized for 500 responses so raw internals are not returned to clients.
- Some business events are logged, for example payment authorization and order-processing flow.

### Remaining risk

- Request ID middleware is present but does not appear to be wired globally in the module configuration, so correlation may be incomplete.
- Logging is mostly operational, not audit-grade.
- There is no dedicated audit trail for security-relevant actions such as login success/failure, role changes, privileged file actions, or admin operations.
- Logs may still miss actor identity, target resource, and decision outcome in a structured way.
- There is no visible retention, alerting, or tamper-resistance strategy.

### Backlog / TODO

- Wire request ID/correlation ID consistently across all entry points.
- Add structured logs for login attempts, role changes, file-upload completion, and privileged actions.
- Define a minimal audit event schema: actor, action, target, result, timestamp, request ID.
- Add alerts for repeated auth failures and suspicious access patterns.
- Review logs to ensure secrets and tokens are never written.
