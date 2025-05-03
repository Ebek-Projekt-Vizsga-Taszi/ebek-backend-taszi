const express = require('express');
const router = express.Router();
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
  kijelentkezes,
  approveUrlap,
  rejectUrlap,
  getSzervezetUrlapok,
} = require('../controllers/userController');
const { authenticateToken, authenticateSzervezet } = require("../mwares/authMiddleware");

// Nyilvános útvonalak
router.post("/regisztracio", registerTulajdonos);
router.post("/login", loginTulajdonos);
router.post("/login/szervezet", loginSzervezet);

// Védett útvonalak tulajdonosoknak
router.get("/tulajdonos/urlapok", authenticateToken, getAllUrlapok);
router.post("/tulajdonos/urlap", authenticateToken, addNewUrlap);
router.get("/tulajdonos/adatok", authenticateToken, getTulajdonosAdatok);
router.get("/tulajdonos/step2", authenticateToken, getStep2Data);
router.get("/tulajdonos/bekuldott-urlapok", authenticateToken, getBekuldottUrlapok);
router.post("/tulajdonos/jelszo-valtoztatas", authenticateToken, JelszoValtoztatas);
router.post("/tulajdonos/kijelentkezes", authenticateToken, kijelentkezes);

// Védett útvonalak szervezeteknek
router.get("/szervezet/urlapok", authenticateSzervezet, getSzervezetUrlapok);
router.put("/szervezet/urlap/:id/approve", authenticateSzervezet, approveUrlap);
router.put("/szervezet/urlap/:id/reject", authenticateSzervezet, rejectUrlap);

module.exports = router;
