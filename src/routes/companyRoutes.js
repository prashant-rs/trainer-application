// companyRoutes.js
const express = require("express");
const router = express.Router();
const {
  registerCompany,
  getAllCompanies,
} = require("../controllers/companyController");

router.post("/companies", registerCompany);
router.get("/companies", getAllCompanies);

module.exports = router;
