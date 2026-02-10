/**
 * ------------------------------------------------------------------
 * Backend Entry Point
 * ------------------------------------------------------------------
 *
 * Tämä tiedosto kokoaa AI-moduulit yhteen ja käynnistää Express-palvelimen.
 *
 * Vaiheet:
 * 1. Lataa ympäristömuuttujat .env-tiedostosta (dotenv).
 * 2. Alustaa Express-sovelluksen.
 * 3. Lisää JSON-parserin POST-pyyntöjä varten.
 * 4. Liittää jobs-reitit polkuun /api/jobs.
 *    -> Esim. POST /api/jobs/summary kutsuu jobs.js /summary reittiä.
 * 5. Käynnistää serverin portissa 3000 tai ympäristömuuttujan PORT mukaisesti.
 */

import express from "express";
import dotenv from "dotenv";
import jobsRoutes from "./routes/jobs.js";
import portfolioRoutes from "./routes/portfolioLLM.js";


dotenv.config();

const app = express();
app.use(express.json()); //JSON parseri

// Routejen määrittelyt
app.use("/api/jobs", jobsRoutes);
app.use("/api/portfolio", portfolioRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
