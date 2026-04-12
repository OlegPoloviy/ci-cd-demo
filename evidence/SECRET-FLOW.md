# This document describes how the secrets flow works

Secrets are stored in GitHub Environment Secrets.
Rotation is done by replacing the secret value in the target environment, then redeploying the affected services.
Stage and production are rotated independently.
Old credentials/keys are revoked after successful rollout verification.

## How secrets enter the build or code?

In our workflow files `compose.prod.yml` and `compose.stage.yml` uses generated secrets from Github enviroment, stage and prod
<img width="807" height="649" alt="image" src="https://github.com/user-attachments/assets/6cbe3ae4-6768-43d9-bf64-35a78bed734f" />
