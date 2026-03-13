# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

API Integration microservice for the 24H CARGO platform. Provides OAuth-based third-party API access, usage tracking, analytics, and a developer dashboard.

## Commands

```bash
npm start          # Start with nodemon (port 4108)
npm install --legacy-peer-deps
```

No tests or linting configured.

## Architecture

- **Entry:** `server.js` → mounts routes at `/api` from `routes/routes.js`
- **Routes:** `routes/routes.js` — OAuth token (public), API apps (auth), dashboard/usage (auth), third-party APIs (OAuth bearer)
- **Controllers (8):** apiApps, oauthToken, dashboard, usage, analytics, rates, geo, createShipment, sequence
- **Models (13):** `db/models/` — apiApp, apiUsageLog, customer, shipment, rate, country, state, city, address, sender, serviceType, extraCharge, role, user, origin, sequence
- **Middlewares (4):** `authentication` (user JWT), `bearerAuth` (OAuth token), `usageLogger`, `shipmentValidation`
- **Response helpers:** `utils/response.js` — `success()`, `error()`
- **Logging:** `utils/logger.js` — Winston

## Key Endpoints

- `POST /oauth-api/token` — issue JWT via client_id + secret_key (public)
- API Apps CRUD (authenticated)
- Dashboard & usage analytics (authenticated)
- `POST /get-rates`, `GET /countries`, `GET /states/:countryId`, `GET /cities` (OAuth bearer)
- `POST /create-shipment` (OAuth bearer)

## Key Details

- ES Modules (`"type": "module"`)
- OAuth flow: client_id (UUID v4) + secret_key (crypto.randomBytes) → bcrypt hashed → JWT with tokenType "oauth"
- Rate limiting on API endpoints
- RabbitMQ integration (amqplib)
- express-validator + Joi for validation
