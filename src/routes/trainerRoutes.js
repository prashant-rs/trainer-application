// trainerRoutes.js
const express = require("express");
const router = express.Router();
const {
  registerTrainer,
  getAllTrainers,
} = require("../controllers/trainerController");

router.post("/trainers", registerTrainer);
router.get("/trainers", getAllTrainers);

module.exports = router;
