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
        tulajdonosEmail: true
      }
    });

    if (!tulajdonos) {
      return res.status(404).json({ message: "Tulajdonos nem található" });
    }

    res.json(tulajdonos);
  } catch (error) {
    console.error("Hiba a tulajdonos adatok lekérésekor:", error);
    res.status(500).json({ 
      message: "Hiba történt az adatok lekérése során",
      error: error.message 
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
      oltanyagSorszam
    } = req.body;
  
    // Dátum formátum átalakító függvény
    const parseDate = (dateString) => {
      if (!dateString) return null;
      
      // Csak akkor próbáljuk meg átalakítani, ha pontokkal elválasztott
      if (typeof dateString === 'string' && dateString.includes('.')) {
        const [year, month, day] = dateString.split('.');
        
        // Ellenőrizzük, hogy minden rész szám-e
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        
        // Hónap és nap ellenőrzése
        const monthInt = parseInt(month, 10);
        const dayInt = parseInt(day, 10);
        if (monthInt < 1 || monthInt > 12) return null;
        if (dayInt < 1 || dayInt > 31) return null;
  
        return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
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
      oltasiBelyegzoSzam: "Oltási bélyegző szám"
    };
  
    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !req.body[field])
      .map(([_, name]) => name);
  
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Hiányzó kötelező adatok!",
        missingFields: missingFields
      });
    }
  
    // Dátumok validálása
    const szulIdo = parseDate(ebSzulIdeje);
    const ivartalanitasIdoDate = parseDate(ivartalanitasIdo);
    const oltasIdo = parseDate(oltasiIdo);
  
    if (!szulIdo) {
      return res.status(400).json({ 
        success: false,
        message: "Érvénytelen születési dátum formátum! Használj ÉÉÉÉ.HH.NN formátumot."
      });
    }
  
    if (ivartalanitasIdo && !ivartalanitasIdoDate) {
      return res.status(400).json({ 
        success: false,
        message: "Érvénytelen ivartalanítási dátum formátum! Használj ÉÉÉÉ.HH.NN formátumot."
      });
    }
  
    if (!oltasIdo) {
      return res.status(400).json({ 
        success: false,
        message: "Érvénytelen oltási dátum formátum! Használj ÉÉÉÉ.HH.NN formátumot."
      });
    }
  
    try {
      // 1. Ellenőrizzük, hogy létezik-e a tulajdonos
      const tulajdonos = await prisma.tulajdonos.findUnique({
        where: { id: tulajdonosId }
      });
  
      if (!tulajdonos) {
        return res.status(404).json({ 
          success: false,
          message: "Tulajdonos nem található!" 
        });
      }
  
      // 2. Chip sorszám egyediségének ellenőrzése
      const existingEb = await prisma.eb.findUnique({
        where: { chipSorszam: chipSorszam }
      });
  
      if (existingEb) {
        return res.status(400).json({ 
          success: false,
          message: "Ez a chip sorszám már használatban van!" 
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
          oltanyagSorszam: oltanyagSorszam || "N/A",
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
          urlapId: newUrlap.id
        }
      });
    } catch (error) {
      console.error("Hiba történt az új űrlap mentése során:", error);
      
      // Adatbázis hibák kezelése
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: "Az adatok egyediségét megsértő rekord már létezik",
          error: error.meta
        });
      }
  
      res.status(500).json({ 
        success: false,
        message: "Hiba történt az új űrlap mentése során.",
        error: error.message 
      });
    }
  };
module.exports = { registerTulajdonos, loginTulajdonos, loginSzervezet, getAllUrlapok, addNewUrlap, getTulajdonosAdatok };