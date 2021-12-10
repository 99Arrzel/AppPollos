let { response } = require("express");
let express = require("express");
let router = express.Router();
let Usuario = require("../models/Usuarios/usuarios");
let bcrypt = require("bcryptjs");
//Requirement of json web token, just to replace sessions
let jwt = require("jsonwebtoken");
let { isValidObjectId } = require("mongoose");
require("dotenv/config"); //Get secretkey from dotenv
let secretkey = process.env.SECRET_KEY;
//=====================================================
function verifyToken(req, res, next) {
  let bearerHeader = req.headers.authorization;
  if (typeof bearerHeader !== "undefined") {
    let bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else {
    res.status(403).send({ message: "Fallo en la verificacion" });
  }
}
//======================================================
//Hash de password para usuario
let passUsuario = (pass) => {
  let salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(pass, salt);
};
//=============================
//Check if user is admin
async function isAdmin(id) {
  if (isValidObjectId(id)) {
    let usuario = await Usuario.findById(id);
    if (usuario != undefined) {
      if (usuario.nivel == "ADMIN") {
        return true;
      }
    }
    return false;
  }
  return false; //No es un object ID valido.
}
function isTheUserModifyingHimself(modified_id, idUser) {
  if (isValidObjectId(modified_id) && isValidObjectId(idUser)) {
    if (modified_id == idUser) {
      return true;
    }
    return false;
  }
  return false; //No es un object ID valido.
}
//Comparar contraseña con la almacenada.
//Listar todos los usuarios
router.post("/login", async (req, res) => {
  try {
    console.log(req.body);
    let usuario = await Usuario.find({ correo: req.body.correo });
    usuario = usuario[0];
    if (usuario) {
      //Si existe
      console.log(req.body.password, usuario.password);
      if (bcrypt.compareSync(req.body.password, usuario.password)) {
        jwt.sign({ usuario }, secretkey, (err, token) => {
          res.status(200).send({ token });
        });
        return;
      }
      res.status(403).send({ message: "Contraseña erronea." });
    } else {
      if (req.body.correo === undefined) {
        res.status(403).send({ message: "Introduce un correo" });
        return;
      }
      res.status(403).send({ message: "Correo no encontrado" }); //Not found
      return;
    }
  } catch (err) {
    console.log(err);
    res.json({ message: "Hubo un error", err });
  }
});
//Crear usuario !FLAGS == ADMIN ONLY!
router.get("/listarTodos", verifyToken, async (req, res) => {
  try {
    let usuarios = await Usuario.find();
    jwt.verify(req.token, secretkey, (err, authData) => {
      if (err) {
        res.send(403); //if there's an error veryfing, then send 403
      } else {
        if (isAdmin(authData._id)) {
          res.json({
            message: "Lista de usuarios",
            usuarios,
            authData,
          });
          return;
        }
        res.status(403).send({ message: "Acceso denegado" }); //if there's an error veryfing, then send 403
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
    let nuevoUsuario = new Usuario({
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
        res.status(400).send({ message: err });
      });
  } catch (err) {
    res.status(400).send({ message: err });
  }
});
//Dar de baja usuario !FLAGS = ADMIN ONLY! - OK
router.delete("/darDeBaja", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, (err, authData) => {
      if (!isValidObjectId(req.body.idUsuario)) {
        res.status(400).send({ message: "Ese id es invalido." });
        return;
      }
      if (err) {
        res.status(403).send({ message: "Debes estar logeado para esto." }); //if there's an error verifying, then send 403
      } else {
        isAdmin(authData.usuario._id).then(async (result) => {
          console.log(result);
          if (result) {
            let idDeBaja = await Usuario.updateOne(
              { _id: req.body.idUsuario },
              { $set: { estado: "INACTIVO" } }
            );
            if (idDeBaja.matchedCount != 0) {
              res.status(200).send({
                message: "Usuario dado de BAJA",
                idDeBaja,
                authData,
              });
              return;
            } else {
              res.status(400).send({
                message: "Usuario no encontrado.",
                idDeBaja,
                authData,
              });
            }
          } else {
            res.status(403).send({ message: "Sin permisos para esto" });
          }
        });
      }
    });
  } catch (err) {
    res.json({ message: err });
  }
}); //modificar usuario !FLAGS == ADMIN AND SAME USER ONLY! -- OK
router.patch("/modificar", verifyToken, (req, res) => {
  if (!isValidObjectId(req.body.idUsuario)) {
    res.status(400).send({ message: "El id a modificar no es un id valido." });
    return;
  }
  try {
    jwt.verify(req.token, secretkey, async (err, authData) => {
      isAdmin(authData.usuario._id).then(async (result) => {
        if (result) {
          let modificarUsuario = await Usuario.updateOne(
            { _id: req.body.idUsuario },
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
          res.status(200).send({
            message: "Usuario modificado con exito.",
            modificarUsuario,
            authData,
          });
        } else if (
          isTheUserModifyingHimself(req.body.idUsuario, authData.usuario._id)
        ) {
          let modificarUsuario = await Usuario.updateOne(
            { _id: req.body.idUsuario },
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
          res.status(200).send({
            message: "Cambiaste tu perfil con éxito",
            modificarUsuario,
            authData,
          });
        } else {
          res.status(400).send({ message: "Sin autorización" });
        }
      });
    });
  } catch (err) {
    res.json({ message: err });
  }
});
//set usuario como admin  XD - OK
//!FLAGS - ADMIN ONLY!
router.patch("/setAdmin", verifyToken, (req, res) => {
  try {
    if (!isValidObjectId(req.body.idUsuario)) {
      res.status(400).send({ message: "El id invalido" });
      return;
    }
    jwt.verify(req.token, secretkey, (err, authData) => {
      isAdmin(authData.usuario._id).then(async (result) => {
        if (result) {
          let elevarUsuario = await Usuario.updateOne(
            { _id: req.body.idUsuario },
            { $set: { nivel: "ADMIN" } }
          );
          if (elevarUsuario.matchedCount != 0) {
            res.status(200).send({
              message: "ADMIN seteado con exito",
              elevarUsuario,
              authData,
            });
            return;
          }
          res.status(400).send({
            message: "El id no fue encontrado",
            elevarUsuario,
            authData,
          });
        } else {
          res.status(400).send("No permitido.");
        }
      });
    });
  } catch (err) {
    res.json({ message: err });
  }
});
//set usuario como moderador
//!FLAGS - ADMIN ONLY! - OK
router.patch("/setModerador", verifyToken, (req, res) => {
  try {
    if (!isValidObjectId(req.body.idUsuario)) {
      res.status(400).send({ message: "El id invalido" });
      return;
    }
    jwt.verify(req.token, secretkey, (err, authData) => {
      isAdmin(authData.usuario._id).then(async (result) => {
        if (result) {
          let elevarUsuario = await Usuario.updateOne(
            { _id: req.body.idUsuario },
            { $set: { nivel: "MODERADOR" } }
          );
          if (elevarUsuario.matchedCount != 0) {
            res.status(200).send({
              message: "MODERADOR seteado con exito",
              elevarUsuario,
              authData,
            });
            return;
          }
          res.status(400).send({
            message: "El id no fue encontrado",
            elevarUsuario,
            authData,
          });
        } else {
          res.status(400).send("No permitido.");
        }
      });
    });
  } catch (err) {
    res.json({ message: err });
    console.log(err);
  }
});
//Comentario en usuario
//!FLAGS - PUBLIC! NO MATCH SAME ID USER, NO MULTIPLE COMMENTS - OK
router.patch("/addComentario", verifyToken, async (req, res) => {
  //Verifiy token para ver si está logeado
  try {
    if (req.body.estrellas > 10 || req.body.estrellas < 0) {
      res.status(400).send({
        message:
          "La puntuación de estrellas es de 0 a 10, donde cada unidad es media estrella 5/5, no puede ser mayor que 10 y menor que 0.",
      });
      return;
    }
    let esteUsuario = await Usuario.findById(req.body.idUsuario); //Busco al usuario
    let arrayIdsComentaristas = esteUsuario.calificacion.map((item) => {
      return item.id_usuario;
    });
    console.log(arrayIdsComentaristas);
    jwt.verify(req.token, secretkey, async (err, authData) => {
      console.log(authData.usuario._id);
      if (arrayIdsComentaristas.includes(authData.usuario._id)) {
        res.json({ message: "Este usuario ya comentó en este usuario." });
        return; //Parece que se sigue ejecutando el código de abajo
      }
      let nuevaCalificacion = {
        id_usuario: authData.usuario._id,
        comentario: req.body.comentario,
        estrellas: req.body.estrellas,
      };
      //Crea un nuevo comentario, además le da un id, para poder marcarlo o algo así en futuro
      let comentarUsuario = await Usuario.updateOne(
        { _id: req.body.idUsuario },
        { $push: { calificacion: nuevaCalificacion } }
      );
      res.json(comentarUsuario);
    });
  } catch (err) {
    res.json({ message: err });
    console.log(err);
  }
});
//Get Usuario por ID
router.get("/buscarUsuario", verifyToken, async (req, res) => {
  try {
    let esteUsuario = await Usuario.findById(req.body.idUsuario);
    jwt.verify(req.token, secretkey, async (err, authData) => {
      isAdmin(authData.usuario._id).then((result) => {
        if (result) {
          res.status(200).send(esteUsuario);
        } else {
          res
            .status(403)
            .send({ message: "No tienes permisos para buscar por ID" });
        }
      });
    });
  } catch (err) {
    res.json({ message: err });
  }
});
//!FLAGS - ADMIN ONLY
router.patch("/darDeAlta", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, (err, authData) => {
      if (!isValidObjectId(req.body.idUsuario)) {
        res.status(400).send({ message: "Ese id es invalido." });
        return;
      }
      if (err) {
        res.status(403).send({ message: "Debes estar logeado para esto." }); //if there's an error veryfing, then send 403
      } else {
        isAdmin(authData.usuario._id).then(async (result) => {
          console.log(result);
          if (result) {
            let idDeBaja = await Usuario.updateOne(
              { _id: req.body.idUsuario },
              { $set: { estado: "ACTIVO" } }
            );
            if (idDeBaja.matchedCount != 0) {
              res.status(200).send({
                message: "Usuario dado de alta",
                idDeBaja,
                authData,
              });
              return;
            } else {
              res.status(400).send({
                message: "Usuario no encontrado.",
                idDeBaja,
                authData,
              });
            }
          } else {
            res.status(403).send({ message: "Sin permisos para esto" });
          }
        });
      }
    });
  } catch (err) {
    res.json({ message: err });
  }
});
module.exports = router;
