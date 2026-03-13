import express from "express";
import http from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";

import dbConnection from "./db/index.js";
import { DB_URI, PORT } from "./utils/constants.js";

import routes from "./routes/routes.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ strict: false }));

let server;

const apiLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 10, // 10 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again after 30 seconds" },
});

const corsOptions = {
  exposedHeaders: [
    "X-Auth",
    "X-Total-Pages",
    "X-Current-Page",
    "X-Next-Page",
    "X-Prev-Page",
    "X-Total-Records",
  ],
  origin: "*",
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.use(apiLimiter);

app.use("/api", routes);

app.get("/", (req, res) => {
  res.type("application/json").send('{"res": "24H Cargo API Integration Service"}');
});

server = http.Server(app);
dbConnection(DB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`API Integration Service listening on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Error ${err}`);
  });

export default server;
