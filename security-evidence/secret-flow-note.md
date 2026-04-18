# This document describes how the secrets flow works

Secrets are stored in GitHub Environment Secrets.
Rotation is done by replacing the secret value in the target environment, then redeploying the affected services.
Stage and production are rotated independently.
Old credentials/keys are revoked after successful rollout verification.

## How secrets reach runtime?

GitHub Actions writes environment files from GitHub Environment Secrets, then Docker Compose injects them into containers at deploy time.
<img width="807" height="649" alt="image" src="https://github.com/user-attachments/assets/6cbe3ae4-6768-43d9-bf64-35a78bed734f" />

In local enviroment you can create your own .env file from examples and use them either in docker or just set up ewverything locally

## what must never be logged

- `JWT_SECRET`
- Database passwords
- `AWS_SECRET_ACCESS_KEY`
- `RABBITMQ_URL` when it contains credentials
- Bearer tokens and `Authorization` headers
- Any generated `.env` file contents with real secret values

# Current Secure Setup

- Real secrets are not stored in tracked source files.
- Local secrets are kept outside git in a developer-managed `.env` file.
- Stage and production secrets are separated through GitHub Environments.
- Deployment workflows inject secrets into runtime during deployment instead of hardcoding them in application code.

## Production Target State

- The current production-safe approach uses GitHub Environment Secrets as the source of truth for deployment.
- The next target state is to move from generated env files on the host toward managed secret delivery, such as a cloud secret manager or platform-native runtime secret injection.

## rotation per secret type

JWT secret is rotated by updating the GitHub Environment Secret and redeploying the service; existing tokens become invalid.
Database credentials are rotated by changing the DB password, updating the GitHub secret, and redeploying dependent services.
Storage/integration keys are rotated by issuing a new key, updating the secret in GitHub, redeploying, and revoking the old key after verification.
