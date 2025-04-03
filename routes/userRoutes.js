const express = require('express');
const router = express.Router();
const { protect } = require('../mwares/authMiddleware');
const {
  registerTulajdonos,
  loginTulajdonos,
  loginSzervezet,
  getAllUrlapok,
  addNewUrlap,
  getTulajdonosAdatok
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


module.exports = router;
