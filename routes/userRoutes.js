const express = require('express');
const router = express.Router();
const { protect } = require('../mwares/authMiddleware');
const {
  registerTulajdonos,
  loginTulajdonos,
  loginSzervezet,
  getAllUrlapok,
  addNewUrlap,
  getTulajdonosAdatok,
  getStep2Data,
  getBekuldottUrlapok,
  JelszoValtoztatas,
  kijelentkezes
} = require('../controllers/userController');

// Regisztráció tulajdonosoknak
router.post("/regisztracio", registerTulajdonos);

// Bejelentkezés tulajdonosoknak
router.post("/login", loginTulajdonos);

// Bejelentkezés szervezeteknek
router.post("/login/szervezet", loginSzervezet);

// Űrlapok lekérése
router.get("/urlapok", protect, getAllUrlapok);

// Új űrlap hozzáadása
router.post("/Ujurlap", protect, addNewUrlap);

//tulajdonos adatok
router.get('/tulajdonos-adatok', protect, getTulajdonosAdatok);

//step2 adatok
router.get('/step2-adatok', protect, getStep2Data);

//beküldött urlapok
router.get('/bekuldott-urlapok', protect, getBekuldottUrlapok);

// Jelszó módosítása
router.post('/jelszo-valtoztatas', protect, JelszoValtoztatas);

// Kijelentkezés
router.post('/kijelentkezes', protect, kijelentkezes);

module.exports = router;
