const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const generateToken = (id) => {
    return jwt.sign({ id }, "szupertitkostitok", { expiresIn: "1d" });
};

const register = async (req, res) => {
    const { tulajdonosEmail, tulajdonosNeve, tulajdonosCim, tulajdonosTel, jelszo } = req.body;

    // Adatok validálása
    if (!tulajdonosEmail || !tulajdonosNeve || !tulajdonosCim || !jelszo) {
        return res.status(400).json({ message: "Hiányos adatok!" });
    }

    // Ellenőrizzük, hogy az e-mail cím már létezik-e
    const existingUser = await prisma.tulajdonos.findUnique({
        where: { tulajdonosEmail }
    });

    if (existingUser) {
        return res.status(400).json({ message: "Ez az email cím már használatban van!" });
    }

    // Jelszó titkosítása
    const hashedPassword = await argon2.hash(jelszo);

    // Új tulajdonos létrehozása
    const newUser = await prisma.tulajdonos.create({
        data: {
            tulajdonosEmail,
            tulajdonosNeve,
            tulajdonosCim,
            tulajdonosTel,
            jelszo: hashedPassword
        }
    });

    res.status(201).json({
        message: "Sikeres regisztráció!",
        user: { id: newUser.id, tulajdonosNeve: newUser.tulajdonosNeve, tulajdonosEmail: newUser.tulajdonosEmail }
    });
};

const login = async (req, res) => {
    const { tulajdonosEmail, jelszo } = req.body;

    if (!tulajdonosEmail || !jelszo) {
        return res.status(400).json({ message: "Hiányzó adatok!" });
    }

    const user = await prisma.tulajdonos.findUnique({
        where: { tulajdonosEmail }
    });

    if (!user) {
        return res.status(404).json({ message: "Nem létező fiók!" });
    }

    // Jelszó ellenőrzése
    const isPasswordCorrect = await argon2.verify(user.jelszo, jelszo);

    if (isPasswordCorrect) {
        const token = generateToken(user.id);
        return res.status(200).json({
            message: "Sikeres bejelentkezés!",
            username: user.tulajdonosNeve,
            token
        });
    } else {
        return res.status(401).json({ message: "Helytelen jelszó!" });
    }
};

module.exports = { register, login };