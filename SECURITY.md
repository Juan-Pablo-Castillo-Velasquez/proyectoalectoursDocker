# Security Policy

## Supported Versions

This project does not use semantic versioning or maintain multiple
released branches — there is a single `main` branch, and security fixes
are applied there. Always run the latest commit on `main`.

## Reporting a Vulnerability

If you find a security issue in AlecTours (this repository), please
**do not open a public GitHub issue**. Instead, report it privately
using [GitHub's private vulnerability reporting](https://github.com/Juan-Pablo-Castillo-Velasquez/proyectoalectoursDocker/security/advisories/new)
for this repository, or contact the maintainer directly.

Please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce it (a minimal example is ideal).
- Any relevant logs, requests, or screenshots.

There is no formal SLA for this project, but reports will be
acknowledged and triaged as soon as possible, and a fix will be
prioritized according to severity.

## Scope

This is a learning/portfolio project (FastAPI + PostgreSQL backend,
React + TypeScript frontend). Known areas that involve sensitive data
and deserve special attention when reporting issues:

- Authentication and password handling (`backend/app/core/security.py`,
  `backend/app/services/auth_service.py`).
- The checkout and payment flow (`backend/app/routes/reserva_route.py`).
- Admin-only endpoints and role/permission checks
  (`backend/app/core/deps.py`).

Please note that the payment integration in this project is a
**simulated/sandbox flow** — it does not process real payment-card
data or move real money. Findings about the simulation itself (as
opposed to how it is implemented) are still welcome, since the same
code paths would matter if a real payment provider were plugged in.
