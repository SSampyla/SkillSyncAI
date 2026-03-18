import express from "express";
import { asyncHandler, getCache, setCache, createCacheKey } from "../utils/apiCoreLLM.js";
import { createValidator, validateCV } from "../utils/routeValidatorsLLM.js";
import { generateEditedCV } from "../LLM/cvEdit.js";

/*
# CV Edit API
Tämä reititin vastaa ansioluettelon (CV) räätälöinnistä tiettyä työpaikkailmoitusta varten LLM:n avulla.

## Cache
Backend tukee eri "versioiden" tallentamista välimuistiin. 
Kun haet muokatun CV:n ensimmäistä kertaa, saat vastauksena `versionId`:n. Voit käyttää tätä ID:tä myöhemmin hakemaan tismalleen saman tekstin uudelleen nopeasti ilman uutta tekoälykutsua.

* **Jätä `versionId` pois:** Generoi uuden ehdotuksen.
* **Lähetä `versionId`:** Hakee olemassa olevan ehdotuksen välittömästi muistista tai palauttaa uuden jos id ei ole olemassa.

## Reitit

### `POST /edit`
Palauttaa muokatun CV-tekstin.
* **Body:** `{ jobText, cvText, language, versionId? }`
* **Paluuarvo:** `{ editedCV: "...", versionId: "cv_edit_1710..." }`
*/

const router = express.Router();

router.post(
  "/edit",
  createValidator(validateCV),

  asyncHandler(async (req) => {
    const { jobText, cvText, language, versionId } = req.body;

    console.log("[LLM route: CV Edit Request called]");

    // 1. Tarkistetaan, onko pyydetty tiettyä versiota välimuistista
    if (versionId) {
      const cachedVersion = getCache(versionId);
      if (cachedVersion) {
        console.log(`[Cache Hit] Palautetaan CV-versio: ${versionId}`);
        return cachedVersion;
      }
      console.log(`[Cache Miss] Versiota ${versionId} ei löytynyt, luodaan uusi.`);
    }

    // 2. Generoidaan uusi muokattu CV
    const result = await generateEditedCV(jobText, cvText, language);

    // 3. Luodaan uniikki ID tälle versiolle
    const newVersionId = `cv_edit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const response = {
      editedCV: result.editedCV,
      versionId: newVersionId
    };

    // 4. Tallennetaan uusi versio välimuistiin
    // Käytetään 1 tunnin elinaikaa
    if (result.editedCV && result.editedCV.length > 100) {
      setCache(newVersionId, response, 1000 * 60 * 60);

      // Tallennetaan myös input-perusteisella avaimella
      const inputCacheKey = createCacheKey("cv_edit", { jobText, cvText, language });
      setCache(inputCacheKey, response, 1000 * 60 * 60);
    }

    return response;

  }, "CV:n muokkaus")
);

export default router;