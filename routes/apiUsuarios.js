const { response } = require("express");
const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuarios/usuarios");
const bcrypt = require("bcryptjs");
const passUsuario = (pass) => {
  let salt = bcrypt.genSaltSync(10);
  let hash = bcrypt.hashSync(pass, salt);
  console.log(hash);
  return hash;
};
const posiblesRoles = ["ADMIN", "MODERADOR", "USUARIO"];
const nivelUsuario = (nivel) => {
  return posiblesRoles.includes(nivel) ? nivel : "USUARIO";
};
//Listar todos los usuarios
router.get("/listarTodos", async (req, res) => {
  try {
    console.log("XD");
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    res.json({ message: err });
  }
});
//Crear usuario
router.post("/crearUsuario", async (req, res) => {
  try {
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
  } catch (err) {
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
//modificar usuario
router.patch("/modificar/:idUsuario", async (req, res) => {
  console.log(req.body);
  try {
    const modificarUsuario = await Usuario.updateOne(
      { _id: req.params.idUsuario },
      {
        $set: {
          nombre: req.body.nombre,
          apellido: req.body.apellido,
          password: passUsuario(req.body.password),
          ciudad: req.body.ciudad,
          comentario_perfil: req.body.comentario_perfil,
          filtro_lenguaje: req.body.filtro_lenguaje,
          foto_perfil: req.body.foto_perfil,
        },
      }
    );

    res.json(modificarUsuario);
  } catch (err) {
    console.log(err);
    res.json({ message: err });
  }
});
//set usuario como admin
router.patch("/setAdmin/:idUsuario", async (req, res) => {
  try {
    const elevarUsuario = await Usuario.updateOne(
      { _id: req.params.idUsuario },
      { $set: { nivel: "ADMIN" } }
    );
    res.json(elevarUsuario);
  } catch (err) {
    res.json({ message: err });
  }
});
//set usuario como moderador
router.patch("/setModerador/:idUsuario", async (req, res) => {
  try {
    const elevarUsuario = await Usuario.updateOne(
      { _id: req.params.idUsuario },
      { $set: { nivel: "MODERADOR" } }
    );
    res.json(elevarUsuario);
  } catch (err) {
    res.json({ message: err });
  }
});
//set usuario como usuario
router.patch("/setUsuario/:idUsuario", async (req, res) => {
  try {
    const elevarUsuario = await Usuario.updateOne(
      { _id: req.params.idUsuario },
      { $set: { nivel: "USUARIO" } }
    );
    res.json(elevarUsuario);
  } catch (err) {
    res.json({ message: err });
  }
});
//Comentario en usuario
router.patch("/addComentario/:idUsuario", async (req, res) => {
  try {
    const esteUsuario = await Usuario.findById(req.params.idUsuario);
    let arrayIdsComentaristas = esteUsuario.calificacion.map((item) => {
      return item.id_usuario;
    });
    if (arrayIdsComentaristas.includes(req.body.idUsuario)) {
      res.json({ message: "Este usuario ya comentó en este usuario." });
      return; //Parece que se sigue ejecutando el código de abajo
    }
    let nuevaCalificacion = {
      id_usuario: req.body.idUsuario,
      comentario: req.body.comentario,
      estrellas: req.body.estrellas
    };
    const comentarUsuario = await Usuario.updateOne(
      { _id: req.params.idUsuario },
      { $push: {calificacion: nuevaCalificacion}}
    );
    res.json(comentarUsuario);
  } catch (err) {
    res.json({ message: err });
  }
});
//Get Usuario por ID
router.get("/buscarUsuario/:idUsuario", async (req, res) => {
  try {
    const esteUsuario = await Usuario.findById(req.params.idUsuario);
    res.json(esteUsuario);
  } catch (err) {
    res.json({ message: err });
  }
});

router.patch("/darDeBaja/:idUsuario", async (req, res) => {
  try {
    const esteUsuario = await Usuario.updateOne(
      { _id: req.params.idUsuario },
      { $set: { estado: "INACTIVO" } }
    );
    res.json({message: "Dado de baja con exito", usuario: esteUsuario});
  } catch (err) {

    res.json({ message: err });
  }
});
router.patch("/darDeAlta/:idUsuario", async (req, res) => {
  try {
    const esteUsuario = await Usuario.updateOne(
      { _id: req.params.idUsuario },
      { $set: { estado: "ACTIVO" } }
    );
    res.json({message: "Dado de alta con exito", usuario: esteUsuario});
  } catch (err) {
    res.json({ message: err });
  }
});
module.exports = router;
