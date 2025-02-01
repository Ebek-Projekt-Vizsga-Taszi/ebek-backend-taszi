const express = require('express');
const router = express.Router();
const { protect } = require('../mwares/authMiddleware');
const {
    register,
    login,
    getAllTulajdonos
} = require('../controllers/userController');

router.post("/regisztracio", register);
router.post("/login", login);

// Csak bejelentkezett felhasználók láthatják az összes tulajdonost
router.get("/alltulajdonos", protect, getAllTulajdonos);

module.exports = router;
