const express = require('express');
const router = express.Router();
const { protect } = require('../mwares/authMiddleware');
const {
  registerTulajdonos,
  loginTulajdonos,
  loginSzervezet,
  getAllUrlapok,
} = require('../controllers/userController');

// Regisztráció tulajdonosoknak
router.post("/regisztracio", registerTulajdonos);

// Bejelentkezés tulajdonosoknak
router.post("/login", loginTulajdonos);

// Bejelentkezés szervezeteknek
router.post("/login/szervezet", loginSzervezet);

// Űrlapok lekérése
router.get("/urlapok", protect, getAllUrlapok);

module.exports = router;

