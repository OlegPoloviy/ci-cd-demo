# This document describes how the secrets flow works

Secrets are stored in GitHub Environment Secrets.
Rotation is done by replacing the secret value in the target environment, then redeploying the affected services.
Stage and production are rotated independently.
Old credentials/keys are revoked after successful rollout verification.

## How secrets enter the build or code?

In our workflow files `compose.prod.yml` and `compose.stage.yml` uses generated secrets from Github enviroment, stage and prod
