# Antony Swami Alfred Ben, A0253016R
# Security Audit — Virtual Vault

Non-functional security test harness for CS4218 Milestone 3. These scripts
issue live HTTP payloads against a running instance of the app and report
findings to stdout. **They do not fix anything** — the goal is identification.

## Running the audit

Start the app locally on `http://localhost:6060`, then:

```bash
./run_all_tests.sh
```

To save a log:

```bash
./run_all_tests.sh | tee audit.log
```

To run a single category:

```bash
./tests/01_injection.sh
./tests/04_misconfiguration.sh
```

Override targets via env vars:

```bash
BASE_URL=http://staging:6060/api/v1 ROOT_URL=http://staging:6060 ./run_all_tests.sh
```

## Layout

```
security-tests/
├── run_all_tests.sh         # orchestrator
├── lib/
│   └── common.sh            # shared HTTP + output helpers
└── tests/
    ├── 01_injection.sh          # OWASP A03
    ├── 02_access_control.sh     # OWASP A01
    ├── 03_authentication.sh     # OWASP A07
    ├── 04_misconfiguration.sh   # OWASP A05 (headers + CORS)
    ├── 05_info_disclosure.sh    # OWASP A05/A03 (error leaks + validation)
    └── 06_dependencies.sh       # OWASP A06 (npm audit)
```

## Output legend

- `⚠ VV-###` — confirmed finding, cross-references the vulnerability register in the report
- `✔ VV-###` — attack vector blocked by existing defences
- `⊘ VV-###` — test skipped (missing prerequisite, e.g. admin credentials)

## Requirements

- `bash`, `curl`, `python3` (used for JSON parsing)
- `node` (only for the JWT forging test in `03_authentication.sh`)
- `npm` (only for `06_dependencies.sh`)
