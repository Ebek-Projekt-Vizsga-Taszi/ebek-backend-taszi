const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Token dekódolása
            const decoded = jwt.verify(token, process.env.JWT_TOKEN);

            // Felhasználó beállítása a request objektumra
            req.user = await prisma.tulajdonos.findUnique({
                where: { id: decoded.id }
            });

            if (!req.user) {
                return res.status(401).json({ message: "Nem hitelesített felhasználó!" });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: "Érvénytelen token, jelentkezzen be újra!" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Jelentkezzen be!" });
    }
};

const authenticateSzervezet = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Token dekódolása
            const decoded = jwt.verify(token, process.env.JWT_TOKEN);

            // Szervezet beállítása a request objektumra
            req.user = await prisma.szervezet.findUnique({
                where: { id: decoded.id }
            });

            if (!req.user) {
                return res.status(401).json({ message: "Nem hitelesített szervezet!" });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: "Érvénytelen token, jelentkezzen be újra!" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Jelentkezzen be!" });
    }
};

module.exports = { authenticateToken, authenticateSzervezet };