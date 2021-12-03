const { response } = require("express");
const express = require("express");
const router = express.Router();
const Usuario = require("../models/Usuarios/usuarios");
const bcrypt = require("bcryptjs");
//Requirement of json web token, just to replace sessions
const jwt = require("jsonwebtoken");
require("dotenv/config"); //Get secretkey from dotenv
const secretkey = process.env.SECRET_KEY;
//=====================================================
function verifyToken(req, res, next) {
  const bearerHeader = req.headers.authorization;
  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}
//======================================================
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

//Comparar contraseña con la almacenada.
//Listar todos los usuarios
router.post("/login", async (req, res) => {
  try {
    const usuario = await Usuario.find({ correo: req.body.correo });
    if (usuario.length != 0) {
      console.log(req.body.password, usuario[0].password);
      if (bcrypt.compareSync(req.body.password, usuario[0].password)) {
        jwt.sign({ usuario }, secretkey, (err, token) => {
          res.status(200).send({ token });
        });
        return;
      }
      res.status(403).send({ message: "Contraseña erronea." });
    }
    else {
      if (req.body.correo === undefined) {
        res.status(403).send({ message: "Introduce un correo" });
        return;
      }
      res.status(403).send({ message: "Correo no encontrado" }); //Not found
      return;
    }
  } catch (err) {
    res.json({ message: "Hubo un error", err });
  }
});
//Crear usuario !FLAGS == ADMIN ONLY!
router.get("/listarTodos", verifyToken, async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    jwt.verify(req.token, secretkey, (err, authData) => {
      if (err) {
        res.send(403); //if there's an error veryfing, then send 403
      }
      else {
        if (authData.usuario[0].nivel == "ADMIN") {
          res.json({
            message: "Lista de usuarios",
            usuarios,
            authData
          });
          return;
        }
        res.status(403).send({message: "Acceso denegado"}); //if there's an error veryfing, then send 403
      }
    });
  } catch (err) {
    res.json({ message: err });
  }
});
//Crear usuario !FLAGS == PUBLIC!
router.post("/crearUsuario", async (req, res) => {
  try {
    function crearFecha(fecha) {
      //Mes dia año, en ese formato
      return new Date(fecha);
    }
    const nuevoUsuario = new Usuario({
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      nivel: "USUARIO",
      correo: req.body.correo,
      password: passUsuario(req.body.password),
      usuario: req.body.usuario,
      estado: "ACTIVO",
      fecha_nacimiento: crearFecha(req.body.fecha_nacimiento),
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
      estrellas: req.body.estrellas,
    };
    const comentarUsuario = await Usuario.updateOne(
      { _id: req.params.idUsuario },
      { $push: { calificacion: nuevaCalificacion } }
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
    res.json({ message: "Dado de baja con exito", usuario: esteUsuario });
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
    res.json({ message: "Dado de alta con exito", usuario: esteUsuario });
  } catch (err) {
    res.json({ message: err });
  }
});

module.exports = router;
