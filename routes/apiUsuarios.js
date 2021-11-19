const { response } = require("express");
const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuarios/usuarios");
const bcrypt = require('bcryptjs');
//Listar todos los usuarios
router.get("/listarTodos", async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.json({ message: err });
  }
});
//Crear usuario
router.post("/crearUsuario", async (req, res) => {
  try {
    let posiblesRoles = ["ADMIN", "MODERADOR", "USUARIO"];
    let passUsuario = (pass) => {
      let salt = bcrypt.genSaltSync(10);
      let hash = bcrypt.hashSync(pass, salt);
      console.log(hash);
      return hash;
    };
    let nivelUsuario = (nivel) => { return posiblesRoles.includes(nivel) ? nivel : "USUARIO"; };
    const nuevoUsuario = new Usuario({
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      nivel: nivelUsuario(req.body.nivel),
      correo: req.body.correo,
      password: passUsuario(req.body.password),
      usuario: req.body.usuario,
      estado: req.body.estado,
      fecha_nacimiento: req.body.fecha_nacimiento,
      ciudad: req.body.ciudad,
    });
    nuevoUsuario
      .save()
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.json({ message: err });
      });
  }catch (err) {
    res.json({ message: err });
  }
});
//Dar de baja usuario
router.delete("/darDeBaja/:idUsuario", async (req, res) => {
  try {
    const idDeBaja = await Usuario.updateOne({ _id: req.params.idUsuario });
    res.json(idDeBaja);
  } catch (err) {
    res.json({ message: err });
  }
});
module.exports = router;