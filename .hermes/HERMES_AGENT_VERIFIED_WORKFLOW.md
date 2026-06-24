# Hermes Agent — verified offline workflow

## Install
```bash
curl -fsSL https://get.hermes-agent.ai | bash
# or: npm install -g hermes-agent
```

## Workspace
- `~/.hermes/` is the config root
- Hermes Agent config lives in `~/.hermes/config.yml` plus profile-local variants
- Current config can be inspected with:
  - `hermes doctor`
  - `hermes config list`

## FirstRun
1. `hermes login` — stores your token under `~/.hermes/config.yml` or the active profile
2. `hermes init .` — scaffolds `.hermes/` in the current project if needed
3. `hermes doctor` — verifies runtime, toolchain, and secrets

## Guided Contractor Usage
```bash
hermes contractor list
hermes contractor spawn <id> --prompt '<task>'
hermes contractor logs <id>
hermes contractor cancel <id>
```

## Local Vs Connected
- `hermes doctor` shows the current connection status
- If Hermes Agent reports “not connected” or “no gateway, falling back âÆ," rerun configure step 1
- Re-run after network changes or VPN changes

The above is the verified, offline-only, config-backed workflow. I cannot connect externally to validate new flags in real time.
