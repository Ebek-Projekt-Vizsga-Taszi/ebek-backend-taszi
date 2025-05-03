const express = require("express");
const cors = require("cors");
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

// Route-ok beállítása
app.use("/felhasznalok", require('./routes/userRoutes'));
app.use("/ok", require('./routes/userRoutes'));

// Alap route
app.get("/", (req, res) => {
    res.json({message: "Ebosszeiro projekt"});
});

// Hibakezelés
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Szerverhiba történt!" });
});

// Szerver indítása fix 8000-es porton
app.listen(8000, () => {
    console.log("Fut a szerver a 8000-es porton!");
});