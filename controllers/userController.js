const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Token generálása
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_TOKEN, { expiresIn: "1d" });
};

// Tulajdonos regisztráció
const registerTulajdonos = async (req, res) => {
  const { tulajdonosEmail, tulajdonosNeve, tulajdonosCim, tulajdonosTel, jelszo } = req.body;

  if (!tulajdonosEmail || !tulajdonosNeve || !tulajdonosCim || !jelszo) {
    return res.status(400).json({ message: "Hiányos adatok!" });
  }

  const existingUser = await prisma.tulajdonos.findUnique({
    where: { tulajdonosEmail },
  });

  if (existingUser) {
    return res.status(400).json({ message: "Ez az email cím már használatban van!" });
  }

  const hashedPassword = await argon2.hash(jelszo);

  const newUser = await prisma.tulajdonos.create({
    data: {
      tulajdonosEmail,
      tulajdonosNeve,
      tulajdonosCim,
      tulajdonosTel,
      jelszo: hashedPassword,
    },
  });

  res.status(201).json({
    message: "Sikeres regisztráció!",
    user: { id: newUser.id, tulajdonosNeve: newUser.tulajdonosNeve, tulajdonosEmail: newUser.tulajdonosEmail },
  });
};

// Tulajdonos bejelentkezés
const loginTulajdonos = async (req, res) => {
  const { tulajdonosEmail, jelszo } = req.body;

  if (!tulajdonosEmail || !jelszo) {
    return res.status(400).json({ message: "Hiányzó adatok!" });
  }

  const user = await prisma.tulajdonos.findUnique({
    where: { tulajdonosEmail },
  });

  if (!user) {
    return res.status(404).json({ message: "Nem létező fiók!" });
  }

  const isPasswordCorrect = await argon2.verify(user.jelszo, jelszo);

  if (isPasswordCorrect) {
    const token = generateToken(user.id, "tulajdonos");
    return res.status(200).json({
      message: "Sikeres bejelentkezés!",
      username: user.tulajdonosNeve,
      token,
    });
  } else {
    return res.status(401).json({ message: "Helytelen jelszó!" });
  }
};

// Szervezet bejelentkezés
const loginSzervezet = async (req, res) => {
  const { email, jelszo } = req.body;

  if (!email || !jelszo) {
    return res.status(400).json({ message: "Hiányzó adatok!" });
  }

  const szervezet = await prisma.szervezet.findUnique({
    where: { email },
  });

  if (!szervezet) {
    return res.status(404).json({ message: "Nem létező fiók!" });
  }

  const isPasswordCorrect = await argon2.verify(szervezet.jelszo, jelszo);

  if (isPasswordCorrect) {
    const token = generateToken(szervezet.id, "szervezet");
    return res.status(200).json({
      message: "Sikeres bejelentkezés!",
      username: szervezet.nev,
      token,
    });
  } else {
    return res.status(401).json({ message: "Helytelen jelszó!" });
  }
};

// Űrlapok lekérése
const getAllUrlapok = async (req, res) => {
  try {
    const urlapok = await prisma.urlap.findMany({ include: { eb: true } });
    res.status(200).json(urlapok);
  } catch (error) {
    res.status(500).json({ message: "Hiba történt az adatok lekérése során." });
  }
};

const getTulajdonosAdatok = async (req, res) => {
  try {
    // A felhasználó ID-ját a middleware-ből kapjuk (pl. JWT tokenből)
    const tulajdonosId = req.user.id;

    // Tulajdonos adatainak lekérése
    const tulajdonos = await prisma.tulajdonos.findUnique({
      where: { id: tulajdonosId },
      select: {
        tulajdonosNeve: true,
        tulajdonosCim: true,
        tulajdonosTel: true,
        tulajdonosEmail: true,
      },
    });

    if (!tulajdonos) {
      return res.status(404).json({ message: "Tulajdonos nem található" });
    }

    res.json(tulajdonos);
  } catch (error) {
    console.error("Hiba a tulajdonos adatok lekérésekor:", error);
    res.status(500).json({
      message: "Hiba történt az adatok lekérése során",
      error: error.message,
    });
  }
};

// POST /api/urlap - Új űrlap beküldése

const addNewUrlap = async (req, res) => {
  // A bejelentkezett tulajdonos ID-ja
  const tulajdonosId = req.user.id;

  const {
    ebHivoneve,
    ebTorzkonyviNeve,
    ebFajtaja,
    ebNeme,
    ebSzulIdeje,
    ebSzine,
    chipSorszam,
    ivartalanitasIdo,
    oltasiIdo,
    orvosiBelyegzoSzam,
    oltasiKonyvSzam,
    oltasiBelyegzoSzam,
    oltanyagSorszam,
    allatorvosBelyegzoSzam,
  } = req.body;

  // Dátum formátum átalakító függvény
  const parseDate = (dateString) => {
    if (!dateString) return null;

    // Csak akkor próbáljuk meg átalakítani, ha pontokkal elválasztott
    if (typeof dateString === "string" && dateString.includes(".")) {
      const [year, month, day] = dateString.split(".");

      // Ellenőrizzük, hogy minden rész szám-e
      if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

      // Hónap és nap ellenőrzése
      const monthInt = parseInt(month, 10);
      const dayInt = parseInt(day, 10);
      if (monthInt < 1 || monthInt > 12) return null;
      if (dayInt < 1 || dayInt > 31) return null;

      return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    }

    // Ha nem string vagy nem pontokkal elválasztott, próbáljuk meg közvetlenül
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Validáció - kötelező mezők
  const requiredFields = {
    ebHivoneve: "Kutya hivatalos neve",
    ebFajtaja: "Kutya fajtája",
    ebNeme: "Kutya neme",
    ebSzulIdeje: "Születési dátum",
    ebSzine: "Kutya színe",
    chipSorszam: "Chip sorszám",
    oltasiIdo: "Oltás időpontja",
    orvosiBelyegzoSzam: "Orvosi bélyegző szám",
    oltasiKonyvSzam: "Oltási könyv szám",
    oltasiBelyegzoSzam: "Oltási bélyegző szám",
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([field]) => !req.body[field])
    .map(([_, name]) => name);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Hiányzó kötelező adatok!",
      missingFields: missingFields,
    });
  }

  // Dátumok validálása
  const szulIdo = parseDate(ebSzulIdeje);
  const ivartalanitasIdoDate = parseDate(ivartalanitasIdo);
  const oltasIdo = parseDate(oltasiIdo);

  if (!szulIdo) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen születési dátum formátum! Használj ÉÉÉÉ.HH.NN formátumot.",
    });
  }

  if (ivartalanitasIdo && !ivartalanitasIdoDate) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen ivartalanítási dátum formátum! Használj ÉÉÉÉ.HH.NN formátumot.",
    });
  }

  if (!oltasIdo) {
    return res.status(400).json({
      success: false,
      message: "Érvénytelen oltási dátum formátum! Használj ÉÉÉÉ.HH.NN formátumot.",
    });
  }

  try {
    // 1. Ellenőrizzük, hogy létezik-e a tulajdonos
    const tulajdonos = await prisma.tulajdonos.findUnique({
      where: { id: tulajdonosId },
    });

    if (!tulajdonos) {
      return res.status(404).json({
        success: false,
        message: "Tulajdonos nem található!",
      });
    }

    // 3. Eb létrehozása
    const newEb = await prisma.eb.create({
      data: {
        hivonev: ebHivoneve,
        utlevelSzam: ebTorzkonyviNeve || null,
        fajta: ebFajtaja,
        nem: ebNeme,
        szulIdo: szulIdo,
        szin: ebSzine,
        chipSorszam: chipSorszam,
        ivartalanitasIdo: ivartalanitasIdoDate,
        tartoId: tulajdonosId,
        oltasiKonyvSzam: oltasiKonyvSzam,
        ivartalanitasBelyegzo: oltasiBelyegzoSzam,
      },
    });

    // 4. Oltás létrehozása
    const newOltas = await prisma.oltas.create({
      data: {
        oltasIdo: oltasIdo,
        orvosiBelyegzoSzam: orvosiBelyegzoSzam,
        oltasTipusa: "Veszettség elleni",
        oltanyagSorszam: oltanyagSorszam,
        allatorvosBelyegzoszam: allatorvosBelyegzoSzam || oltasiBelyegzoSzam,
        ebId: newEb.id,
      },
    });

    // 5. Űrlap létrehozása
    const newUrlap = await prisma.urlap.create({
      data: {
        bekuldesiHatarido: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        bekuldesDatuma: new Date(),
        ebId: newEb.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Sikeres űrlap beküldés!",
      data: {
        ebId: newEb.id,
        oltasId: newOltas.id,
        urlapId: newUrlap.id,
      },
    });
  } catch (error) {
    console.error("Hiba történt az új űrlap mentése során:", error);

    // Adatbázis hibák kezelése
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Az adatok egyediségét megsértő rekord már létezik",
        error: error.meta,
      });
    }

    res.status(500).json({
      success: false,
      message: "Hiba történt az új űrlap mentése során.",
      error: error.message,
    });
  }
};
const getStep2Data = async (req, res) => {
  try {
    // Ellenőrizzük a hitelesítést
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Hitelesítés szükséges" });
    }

    const tulajdonosId = req.user.id;

    // 1. Lekérjük a tulajdonos legutóbbi ebjét és a hozzá tartozó űrlapot
    const legutobbiEb = await prisma.eb.findFirst({
      where: {
        tartoId: tulajdonosId,
      },
      orderBy: {
        id: "desc", // Legújabb elöl
      },
      include: {
        oltasok: {
          orderBy: {
            oltasIdo: "desc",
          },
          take: 1, // Csak a legutóbbi oltást
        },
        urlapok: {
          orderBy: {
            bekuldesDatuma: "desc",
          },
          take: 1, // Csak a legutóbbi űrlapot
        },
      },
    });

    if (!legutobbiEb) {
      return res.status(404).json({
        message: "Nincs mentett kutyaadatok",
        details: "A felhasználónak még nincs mentett kutyája",
      });
    }

    // 2. Formázzuk a választ
    const responseData = {
      // Alap kutya adatok
      ebHivoneve: legutobbiEb.hivonev || "",
      ebTorzskonyviNeve: legutobbiEb.utlevelSzam || "",
      ebFajtaja: legutobbiEb.fajta || "",
      ebNeme: legutobbiEb.nem || "Szuka",
      ebSzulIdeje: legutobbiEb.szulIdo ? formatDate(legutobbiEb.szulIdo) : "",
      ebSzine: legutobbiEb.szin || "",
      mikrochip: !!legutobbiEb.chipSorszam,
      mikrochipSorszam: legutobbiEb.chipSorszam || "",
      ivartalanitott: !!legutobbiEb.ivartalanitasIdo,
      ivartalanitasIdopontja: legutobbiEb.ivartalanitasIdo ? formatDate(legutobbiEb.ivartalanitasIdo) : "",
      oltasiKonyvSzam: legutobbiEb.oltasiKonyvSzam || "",

      // Oltási adatok (kihagyjuk az oltasIdo-t)
      utolsoOltas: legutobbiEb.oltasok[0]
        ? {
            oltasTipusa: legutobbiEb.oltasok[0].oltasTipusa || "",
            orvosiBelyegzoSzam: legutobbiEb.oltasok[0].orvosiBelyegzoSzam || "",
            oltanyagSorszam: legutobbiEb.oltasok[0].oltanyagSorszam || "",
            allatorvosBelyegzoSzam: legutobbiEb.oltasok[0].allatorvosBelyegzoszam || "",
          }
        : null,

      // Űrlap adatok (állatorvosi bélyegző szám)
      utolsoUrlap: legutobbiEb.oltasok[0] // Az oltásból vesszük az adatot!
        ? {
            allatorvosBelyegzoSzam: legutobbiEb.oltasok[0].allatorvosBelyegzoszam || "",
          }
        : null,
    };

    res.json(responseData);
  } catch (error) {
    console.error("Hiba az adatlap lekérésekor:", error);
    res.status(500).json({
      message: "Hiba történt az adatlap lekérése során",
      error: error.message,
    });
  }
};

// Dátum formázó segédfüggvény (ÉÉÉÉ.HH.NN formátum)
function formatDate(date) {
  if (!date) return "";

  // Ha stringként jön (pl. ISO string), konvertáljuk Date objektummá
  if (typeof date === "string") {
    date = new Date(date);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

const getBekuldottUrlapok = async (req, res) => {
  try {
    const tulajdonosId = req.user.id;

    // 1. Lekérjük a tulajdonos összes űrlapját a kapcsolódó adatokkal
    const urlapok = await prisma.urlap.findMany({
      where: {
        eb: {
          tartoId: tulajdonosId,
        },
      },
      orderBy: {
        bekuldesDatuma: "desc",
      },
      include: {
        eb: {
          include: {
            oltasok: {
              orderBy: {
                oltasIdo: "desc",
              },
              take: 1,
            },
            tulajdonos: true, // Itt javítottuk a mezőnevet
          },
        },
      },
    });

    // 2. Formázzuk a választ
    const formazottUrlapok = urlapok.map((urlap) => {
      const legutobbiOltas = urlap.eb.oltasok?.[0] || null;
      const tulajdonos = urlap.eb.tulajdonos || {}; // Itt is javítottuk a mezőnevet

      return {
        id: urlap.id,
        status: urlap.status || "feldolgozas_alatt",
        bekuldesDatuma: urlap.bekuldesDatuma,
        bekuldesiHatarido: urlap.bekuldesiHatarido,

        // Kutya adatai
        ebHivoneve: urlap.eb?.hivonev || "",
        ebTorzkonyviNeve: urlap.eb?.utlevelSzam || "",
        ebFajtaja: urlap.eb?.fajta || "",
        ebNeme: urlap.eb?.nem || "Szuka",
        ebSzulIdeje: urlap.eb?.szulIdo || "",
        ebSzine: urlap.eb?.szin || "",
        chipSorszam: urlap.eb?.chipSorszam || "",
        ivartalanitasIdo: urlap.eb?.ivartalanitasIdo || "",
        oltasiKonyvSzam: urlap.eb?.oltasiKonyvSzam || "",

        // Oltási adatok
        oltasiIdo: legutobbiOltas?.oltasIdo || "",
        orvosiBelyegzoSzam: legutobbiOltas?.orvosiBelyegzoSzam || "",
        oltasiBelyegzoSzam: legutobbiOltas?.oltasiBelyegzoSzam || "",
        oltasTipusa: legutobbiOltas?.oltasTipusa || "",

        // Tulajdonos adatai
        tulajdonosNeve: tulajdonos.tulajdonosNeve || req.user.teljesNev || "",
        tulajdonosCim: tulajdonos.tulajdonosCim || req.user.cim || "",
        tulajdonosTel: tulajdonos.tulajdonosTel || req.user.telefon || "",
        tulajdonosEmail: tulajdonos.tulajdonosEmail || req.user.email || "",
      };
    });

    if (formazottUrlapok.length === 0) {
      return res.status(404).json({
        message: "Nincsenek beküldött űrlapok",
        details: "A felhasználónak még nincsenek beküldött űrlapjai",
      });
    }

    res.json(formazottUrlapok);
  } catch (error) {
    console.error("Hiba a beküldött űrlapok lekérésekor:", error);
    res.status(500).json({
      message: "Hiba történt a beküldött űrlapok lekérése során",
      error: error.message,
    });
  }
};

// Jelszó módosítás
const JelszoValtoztatas = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Tulajdonos lekérdezése
    const tulajdonos = await prisma.tulajdonos.findUnique({
      where: { id: req.user.id },
    });

    if (!tulajdonos || !tulajdonos.jelszo) {
      return res.status(400).json({
        success: false,
        message: "Tulajdonos nem található vagy nincs jelszó megadva",
      });
    }

    // 2. Jelenlegi jelszó ellenőrzése
    const isValid = await argon2.verify(tulajdonos.jelszo, currentPassword);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Hibás jelenlegi jelszó",
      });
    }

    // 3. Új jelszó hash-elése
    const hashedPassword = await argon2.hash(newPassword);

    // 4. Jelszó frissítése
    await prisma.tulajdonos.update({
      where: { id: req.user.id },
      data: { jelszo: hashedPassword },
    });

    res.json({
      success: true,
      message: "Jelszó sikeresen megváltoztatva",
    });
  } catch (error) {
    console.error("Hiba a jelszó módosításakor:", error);
    res.status(500).json({
      success: false,
      message: "Szerverhiba",
      error: error.message,
    });
  }
};

// Kijelentkezés
const kijelentkezes = async (req, res) => {
  try {
    // Itt lehetne token érvénytelenítés is
    res.json({
      success: true,
      message: "Sikeres kijelentkezés",
    });
  } catch (error) {
    console.error("Hiba a kijelentkezéskor:", error);
    res.status(500).json({
      success: false,
      message: "Szerverhiba",
      error: error.message,
    });
  }
};
module.exports = {
  registerTulajdonos,
  loginTulajdonos,
  loginSzervezet,
  getAllUrlapok,
  addNewUrlap,
  getTulajdonosAdatok,
  getStep2Data,
  getBekuldottUrlapok,
  JelszoValtoztatas,
  kijelentkezes,
};
