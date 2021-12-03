const express = require("express");
const router = express.Router();
const LocalComida = require("../models/Locales/locales");
const Usuario = require("../models/Usuarios/usuarios");

router.get("/listarTodos", async (req, res) => {
  try {
    const locales = await LocalComida.find();
    res.json(locales);
  }
  catch (err) {
    res.json({ message: err });
  }
});


module.exports = router;