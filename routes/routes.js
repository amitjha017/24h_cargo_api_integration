import express from "express";
import { authentication } from "../middlewares/authenticator.js";
import { oauthBearerAuth } from "../middlewares/bearerAuth.js";
import { usageLogger } from "../middlewares/usageLogger.js";
import { chargeAction } from "../middlewares/walletCheck.js";

// Controllers
import { createApp, listApps, getApp, deleteApp } from "../controllers/apiApps.js";
import { issueToken } from "../controllers/oauthToken.js";
import { getDashboard, getDashboardSummary } from "../controllers/dashboard.js";
import { getAppUsage, getCompanyUsage } from "../controllers/usage.js";
import { getWallet, getTransactions, topUpWallet, deductWallet } from "../controllers/wallet.js";
import { getApiUsageAnalytics, getWalletAnalytics } from "../controllers/analytics.js";
import { getRates } from "../controllers/rates.js";
import { getCountries, getStatesByCountry, getCities } from "../controllers/geo.js";

const router = express.Router();

// ─── OAuth Token (Public - uses client_id + secret_key) ─────────────
router.post("/oauth-api/token", issueToken);

// ─── API Apps (Authenticated - user Bearer token) ───────────────────
router.post("/api-apps", authentication, createApp);
router.get("/api-apps", authentication, listApps);
router.get("/api-apps/:id", authentication, getApp);
router.delete("/api-apps/:id", authentication, deleteApp);
router.get("/api-apps/:id/usage", authentication, getAppUsage);

// ─── Dashboard (Authenticated) ─────────────────────────────────────
router.get("/dashboard", authentication, getDashboard);
router.get("/dashboard/summary", authentication, getDashboardSummary);

// ─── Usage (Authenticated) ──────────────────────────────────────────
router.get("/usage", authentication, getCompanyUsage);

// ─── Wallet (Authenticated) ─────────────────────────────────────────
router.get("/wallet", authentication, getWallet);
router.get("/wallet/transactions", authentication, getTransactions);
router.post("/wallet/topup", authentication, topUpWallet);
router.post("/wallet/deduct", authentication, deductWallet);

// ─── Analytics (Authenticated) ──────────────────────────────────────
router.get("/analytics/api-usage", authentication, getApiUsageAnalytics);
router.get("/analytics/wallet", authentication, getWalletAnalytics);

// ═══════════════════════════════════════════════════════════════════════
// ─── Third-Party Integration APIs (OAuth Bearer Token) ──────────────
// These endpoints are used by external apps via client_id/secret_key
// ═══════════════════════════════════════════════════════════════════════

// ─── Rates (FREE - no wallet charge) ────────────────────────────────
router.post("/get-rates", oauthBearerAuth, usageLogger, getRates);

// ─── Geo: Countries, States, Cities (FREE - no wallet charge) ───────
router.get("/countries", oauthBearerAuth, usageLogger, getCountries);
router.get("/states/:countryId", oauthBearerAuth, usageLogger, getStatesByCountry);
router.get("/cities", oauthBearerAuth, usageLogger, getCities);

// ─── Shipments (CHARGED - deducts from wallet) ──────────────────────
// router.post("/shipments", oauthBearerAuth, usageLogger, chargeAction("create_shipment"), createShipmentHandler);

export default router;
