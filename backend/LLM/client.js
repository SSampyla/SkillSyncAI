/**
 * ------------------------------------------------------------------
 * Azure OpenAI Client - Yhteyden alustaminen
 * ------------------------------------------------------------------
 *
 * Luo ja konfiguroi OpenAI-asiakasohjelman (client),
 * jota käytetään kommunikoimaan Azuressa sijaitsevan tekoälymallin kanssa.
 *
 * .env-tiedostossa tulee olla:
 * - AZURE_OPENAI_KEY
 * - AZURE_OPENAI_ENDPOINT
 * - AZURE_OPENAI_DEPLOYMENT
 *
 * Käyttö:
 * Importtaa client muista tiedostoista:
 *   import client from "./client.js";
 *   ja käytä chat.completions.create tai muita metodeja.
 */

import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

export const AZURE_MODEL = process.env.AZURE_OPENAI_BASE;
export const AZURE_MODEL_FASTER = process.env.AZURE_OPENAI_FASTER;

// Luodaan client AZURE OpenAI:lle
const client = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_KEY,
    baseURL: process.env.AZURE_OPENAI_ENDPOINT
    });

export default client;