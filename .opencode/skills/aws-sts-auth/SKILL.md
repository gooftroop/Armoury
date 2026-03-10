---
name: aws-sts-auth
description: Authenticate to AWS using STS temporary credentials with MFA. Load this skill BEFORE any task that requires AWS API access (deploy, S3 operations, Lambda invocations, CloudFormation, CDK, Terraform, or any aws cli / SDK call). Triggers on any AWS operation that needs valid credentials.
---

# AWS STS Authentication

Ensure valid AWS credentials exist before performing any AWS operation.

## When to Load This Skill

Load this skill **before** any task that will call AWS APIs, including:

- `aws` CLI commands (s3, lambda, cloudformation, etc.)
- AWS SDK calls from application code
- CDK / SAM / Terraform deployments
- Any agent task that touches AWS resources

## Script Location

The script is installed at `$HOME/.local/bin/sts-auth`. Since `~/.local/bin` may not be
on `$PATH` in non-login shells, **always use the full path**:

```
STS_AUTH="$HOME/.local/bin/sts-auth"
```

## Architecture

- `[sts-longterm]` profile in `~/.aws/credentials` holds the permanent static IAM keys (never overwritten).
- `[default]` profile gets temporary STS session credentials (12h lifetime).
- The STS call uses `--profile sts-longterm` so it works even when `[default]` has expired session tokens.
- On first use, `sts-auth` auto-initializes by copying current `[default]` static keys to `[sts-longterm]`.

## Workflow (MANDATORY — follow exactly)

### Step 1: Check if credentials are valid

```bash
$STS_AUTH --check
```

- **Exit code 0** → Credentials are valid. Proceed with the AWS task. Skip to Step 4.
- **Exit code 1** → Credentials are expired or missing. Continue to Step 2.

### Step 2: Ask the user for their MFA code

If credentials are expired, you MUST ask the user for their 6-digit MFA code. Use this exact phrasing:

> Your AWS session has expired. Please open your authenticator app and provide the 6-digit MFA code for your AWS account.

**CRITICAL**: Do NOT proceed without the code. Do NOT guess. Do NOT skip. Wait for the user to provide it.

### Step 3: Run the auth script with the MFA code

Once the user provides the code (e.g., `123456`):

```bash
$STS_AUTH 123456
```

- **If it succeeds** → Proceed to Step 4.
- **If it fails** (e.g., wrong code, expired code) → Tell the user the code was invalid and ask for a fresh one. MFA codes rotate every 30 seconds.

### Step 4: Verify

After successful auth, confirm with:

```bash
$STS_AUTH --status
```

This shows the remaining session lifetime and the authenticated identity. Report this to the user briefly before proceeding with the original task.

## Error Handling

| Error                       | Cause                          | Action                                                                         |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| `ExpiredTokenException`     | MFA code too old (>30s)        | Ask user for a fresh code                                                      |
| `AccessDenied`              | Wrong code or wrong MFA device | Ask user to double-check and retry                                             |
| `No MFA device found`       | MFA not enabled on account     | Tell user to enable MFA in AWS Console                                         |
| `jq: command not found`     | jq not installed               | Run `sudo apt install jq`                                                      |
| `No [sts-longterm] profile` | First run                      | Script auto-inits; if that fails, tell user to run `$STS_AUTH --init` manually |

## Session Lifetime

- Default session: **12 hours** (configurable via `STS_AUTH_DURATION` env var)
- After 12h, credentials expire and the flow must be repeated
- The `--check` command detects this automatically

## Rules

1. **NEVER skip the check.** Always run `$STS_AUTH --check` before any AWS operation.
2. **NEVER cache or store the MFA code.** Each code is single-use and time-limited.
3. **NEVER proceed with expired credentials.** The AWS operation will fail anyway.
4. **ALWAYS report auth status** to the user after successful authentication.
5. If `--check` returns 0, do NOT re-authenticate. Use existing session.
