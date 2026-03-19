import { jest } from "@jest/globals";

// ---------------------------------------------------------------------------
// fs/promises mock
// ---------------------------------------------------------------------------
jest.unstable_mockModule("fs/promises", () => ({
  default: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    access: jest.fn()
  }
}));

const fs = (await import("fs/promises")).default;
const { readDB, writeDB, INITIAL_STATE } = await import("../services/dbService.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simuloi olemassaoleva, validi db.json */
const mockValidFile = (overrides = {}) =>
  fs.readFile.mockResolvedValue(JSON.stringify({ ...INITIAL_STATE, ...overrides }));

/** Simuloi tiedostoa ei ole / luku epäonnistuu */
const mockMissingFile = () =>
  fs.readFile.mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));

/** Asetetaan ennen jokaista testiä */
const mockFsOk = () => {
  fs.mkdir.mockResolvedValue();
  fs.access.mockResolvedValue();
  fs.writeFile.mockResolvedValue();
};

// ---------------------------------------------------------------------------
// Testit
// ---------------------------------------------------------------------------

describe("dbService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFsOk();
    // Hiljennetään console.error — virhetilanteet ovat odotettuja testeissä
    jest.spyOn(console, "error").mockImplementation(() => { });
    jest.spyOn(console, "log").mockImplementation(() => { });
  });

  afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  // -------------------------------------------------------------------------
  // readDB
  // -------------------------------------------------------------------------
  describe("readDB", () => {
    test("palauttaa oletusrakenne kun tiedosto puuttuu", async () => {
      mockMissingFile();
      const db = await readDB();
      expect(db).toEqual(INITIAL_STATE);
    });

    test("palauttaa oletusrakenne kun readFile heittää muun virheen", async () => {
      fs.readFile.mockRejectedValue(new Error("levy rikki"));
      const db = await readDB();
      expect(db).toEqual(INITIAL_STATE);
    });

    test("palauttaa oletusrakenne kun tiedosto sisältää epäkelvon JSON:n", async () => {
      fs.readFile.mockResolvedValue("ei ole json {{{");
      const db = await readDB();
      expect(db).toEqual(INITIAL_STATE);
    });

    test("mergeaa tiedoston datan INITIAL_STATEen", async () => {
      const jobs = [{ id: "1", title: "Dev" }];
      mockValidFile({ appliedJobs: jobs });
      const db = await readDB();
      expect(db.appliedJobs).toEqual(jobs);
    });

    test("täydentää puuttuvat avaimet INITIAL_STATEsta automaattisesti", async () => {
      // Tiedostossa on vain osa kentistä — loput tulevat INITIAL_STATEsta
      fs.readFile.mockResolvedValue(JSON.stringify({ appliedJobs: [] }));
      const db = await readDB();
      // Kaikki INITIAL_STATE avaimet löytyvät — toimii automaattisesti
      // myös kun INITIAL_STATEa laajennetaan
      for (const key of Object.keys(INITIAL_STATE)) {
        expect(db).toHaveProperty(key);
      }
    });

    test("kutsuu ensureDBExists (mkdir + access)", async () => {
      mockValidFile();
      await readDB();
      expect(fs.mkdir).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // writeDB
  // -------------------------------------------------------------------------
  describe("writeDB", () => {
    test("kirjoittaa vain INITIAL_STATE avaimet — ylimääräiset poistetaan", async () => {
      const dirtyData = {
        ...INITIAL_STATE,
        POISTU_MINÄ: "ei saa tallentua",
        hakkeri: [1, 2, 3]
      };
      await writeDB(dirtyData);

      const written = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(written).not.toHaveProperty("POISTU_MINÄ");
      expect(written).not.toHaveProperty("hakkeri");
    });

    test("kirjoitettu data sisältää kaikki INITIAL_STATE avaimet", async () => {
      await writeDB(INITIAL_STATE);
      const written = JSON.parse(fs.writeFile.mock.calls[0][1]);

      // Automaattinen — laajennetaan INITIAL_STATEa → testi laajenee
      for (const key of Object.keys(INITIAL_STATE)) {
        expect(written).toHaveProperty(key);
      }
    });

    test("käyttää INITIAL_STATE oletusarvoa puuttuvalle avaimelle", async () => {
      // Annetaan data josta puuttuu kaikki avaimet
      await writeDB({});
      const written = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(written).toEqual(INITIAL_STATE);
    });

    test("säilyttää annetun datan sisällön", async () => {
      const jobs = [{ id: "1", title: "Dev" }];
      await writeDB({ ...INITIAL_STATE, appliedJobs: jobs });
      const written = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(written.appliedJobs).toEqual(jobs);
    });

    test("kutsuu writeFile täsmälleen kerran", async () => {
      await writeDB(INITIAL_STATE);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // ensureDBExists (epäsuorasti readDB/writeDB kautta)
  // -------------------------------------------------------------------------
  describe("ensureDBExists", () => {
    test("luo tiedoston oletusarvoilla kun tiedosto puuttuu", async () => {
      mockMissingFile(); // readFile heittää ENOENT

      await readDB();

      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      const created = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(created).toEqual(INITIAL_STATE);
    });

    test("ei luo tiedostoa uudelleen kun se on jo olemassa", async () => {
      mockValidFile();
      await readDB();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });
});