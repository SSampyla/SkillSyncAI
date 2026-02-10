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

// Luodaan client AZURE OpenAI:lle
const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY, 
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
  defaultHeaders: {
    "api-key": process.env.AZURE_OPENAI_KEY 
  },
  defaultQuery: { "api-version": "2024-02-15-preview" } 
});

export default client;
