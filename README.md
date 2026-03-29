# CI/CD homework

In this homework I've implemented new repository with the following structure of branches
The repository follows a simplified GitFlow-like strategy:

main — production-ready code
develop — integration branch for ongoing development
feature/\* — feature-specific branches:

The system consists of multiple services:

orders-api
payments
Each service is containerized using Docker and deployed via Docker Compose.

## CI/CD Pipeline Overview

Build Stage (on develop)
Builds Docker images for:
orders-api
payments
Uses multi-architecture builds:
linux/amd64
linux/arm64
Pushes images to GitHub Container Registry (GHCR)
Generates a release manifest:

```json
{
"commit": "...",
"image_tag": "...",
"services": {
"orders-api": { "image": "...", "digest": "..." },
"payments": { "image": "...", "digest": "..." }
}
```

# Stage Deployment

Triggered automatically after build
Runs on self-hosted Linux runner
Uses:
compose.stage.yml
.env.stage
Pulls images from manifest
Deploys via Docker Compose
Performs health check

# Production Deployment

Triggered manually via workflow_dispatch
Requires:
run_id of successful build
manual approval (GitHub Environment)
Runs on separate self-hosted runner (macOS)
Uses:
compose.prod.yml
.env.production
Deploys exact same artifact as stage (immutable deploy)

# Environment & Secrets

Production and stage environments are configured via:

GitHub Secrets
GitHub Environment variables

Examples:

DB_USER, DB_PASSWORD
JWT_SECRET
AWS_REGION, AWS_ACCESS_KEY_ID, etc.
RABBIT_USER, MINIO_ROOT_USER, etc.

# Release Flow

Push to develop
Build images + create release manifest
Deploy to stage
Manually trigger production deploy
Deploy same images to production

# Proof screenshots

Pr chack
<img width="858" height="330" alt="image" src="https://github.com/user-attachments/assets/e38186db-2ae7-46ec-9324-d9857651084e" />

Build & stage deploy
<img width="1238" height="826" alt="image" src="https://github.com/user-attachments/assets/6797cce0-ad4b-4a4d-a5a6-00147c26458d" />

Approval screen
<img width="903" height="77" alt="image" src="https://github.com/user-attachments/assets/d1ba8b91-b8d2-4140-8823-5450ce8de4ec" />

Production deploy
<img width="1228" height="1036" alt="image" src="https://github.com/user-attachments/assets/51ded47c-2972-45bb-980c-ce45eeef6cd8" />

