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




const addNewUrlap = async (req, res) => {
  console.log("req.body:", req.body); // Ellenőrizd a kapott adatokat

  const {
    tulajdonosTel,
    tulajdonosEmail,
    tulajdonosNeve,
    tulajdonosCim,
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
  } = req.body;

  // Ellenőrizd, hogy minden kötelező mező meg van-e adva
  if (
    !tulajdonosTel ||
    !tulajdonosEmail ||
    !tulajdonosNeve ||
    !tulajdonosCim ||
    !ebHivoneve ||
    !ebFajtaja ||
    !ebNeme ||
    !ebSzulIdeje ||
    !ebSzine ||
    !oltasiIdo ||
    !orvosiBelyegzoSzam ||
    !oltasiKonyvSzam ||
    !oltasiBelyegzoSzam
  ) {
    return res.status(400).json({ message: "Hiányzó adatok!" });
  }

  try {
    const newTulajdonos = await prisma.tulajdonos.create({
      data: {
        tulajdonosTel,
        tulajdonosEmail,
        tulajdonosNeve,
        tulajdonosCim,
      },
    });

    const newEb = await prisma.eb.create({
      data: {
        hivonev: ebHivoneve,
        utlevelSzam: ebTorzkonyviNeve,
        fajta: ebFajtaja,
        nem: ebNeme,
        szulIdo: new Date(ebSzulIdeje),
        szin: ebSzine,
        chipSorszam,
        ivartalanitasIdo: ivartalanitasIdo ? new Date(ivartalanitasIdo) : null,
        tulajdonosId: newTulajdonos.id,
        oltasiKonyvSzam,
        ivartalanitasBelyegzo: oltasiBelyegzoSzam,
      },
    });

    const newOltas = await prisma.oltasi.create({
      data: {
        oltasIdo: new Date(oltasiIdo),
        orvosiBelyegzoSzam,
        oltanyagSorszam: "Veszettség elleni",
        ebId: newEb.id,
      },
    });

    res.status(201).json({ newTulajdonos, newEb, newOltas });
  } catch (error) {
    console.error("Hiba történt az új űrlap mentése során:", error);
    res.status(500).json({ message: "Hiba történt az új űrlap mentése során." });
  }
};

module.exports = { registerTulajdonos, loginTulajdonos, loginSzervezet, getAllUrlapok, addNewUrlap };