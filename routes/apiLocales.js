let express = require("express");
let router = express.Router();
let LocalComida = require("../models/Locales/locales");
let Usuario = require("../models/Usuarios/usuarios");
let jwt = require("jsonwebtoken");
const { isValidObjectId } = require("mongoose");
let secretkey = process.env.SECRET_KEY;
//=============================================
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
async function isAdminOrModerador(id) {
  if (isValidObjectId(id)) {
    let usuario = await Usuario.findById(id);
    if (usuario != undefined) {
      if (usuario.nivel == "ADMIN" || usuario.nivel == "MODERADOR") {
        return true;
      }
    }
    return false;
  }
  return false;
}
async function isModerador(id) {
  if (isValidObjectId(id)) {
    let usuario = await Usuario.findById(id);
    if (usuario != undefined) {
      if (usuario.nivel == "MODERADOR") {
        return true;
      }
    }
    return false;
  }
  return false; //No es un object ID valido.
}
//=============================================
//!FLAGS - PUBLIC
router.get("/listarTodos", async (req, res) => {
  try {
    let locales = await LocalComida.find();
    res.json(locales);
  } catch (err) {
    res.json({ message: err });
  }
});
//
router.post("/crearLocal", verifyToken, async (req, res) => {
  try {
    jwt.verify(req.token, secretkey, (err, authData) => {
      let nuevoLocal = new LocalComida({
        nombre: req.body.nombre,
        direccion: req.body.direccion,
        fotos: req.body.fotos,
        coordenadas: req.body.coordenadas,
        estado: "ACTIVO",
        creador: authData.usuario._id,
      });
      nuevoLocal
        .save()
        .then((data) => {
          res.json(data);
        })
        .catch((error) => {
          res.json({ message: error });
        });
    });
  } catch (err) {
    res.json({ message: err });
    console.log(err);
  }
});
router.post("/addFotosLocal", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, async (err, authData) => {
      if (!isValidObjectId(req.body.idLocal)) {
        res.status(403).send({ message: "El id no es valido" });
        return;
      }
      let nuevaFoto = {
        fotografo: authData.usuario._id,
        direccion: req.body.foto,
      };
      let pushfoto = await LocalComida.updateOne(
        { _id: req.body.idLocal },
        { $push: { fotos: nuevaFoto } }
      );
      if (pushfoto.modifiedCount != 0) {
        res.status(200).send({ message: "Foto guardada 👍", pushfoto });
      } else {
        res.status(200).send({
          message: "La foto no fue guardada, verifica el ID",
          pushfoto,
        });
      }
    });
  } catch {
    res.json({ message: err });
    console.log(err);
  }
});
//!FLAGS - ADMIN AND MODERADOR ONLY! - ok
router.delete("/eliminarFotoLocal", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, (err, authData) => {
      isAdmin(authData.usuario._id).then(async (result) => {
        if (result) {
          if (
            isValidObjectId(req.body.idLocal) &&
            isValidObjectId(req.body.idFoto)
          ) {
            let eliminarFoto = await LocalComida.updateOne(
              { _id: req.body.idLocal },
              { $pull: { fotos: { _id: req.body.idFoto } } }
            );
            if (eliminarFoto.matchedCount != 0) {
              res.status(200).send({
                message: "Foto removida con éxito",
                eliminarFoto,
                authData,
              });
              return;
            } else {
              res.status(200).send({
                message: "Fallo al remover la foto",
                eliminarFoto,
                authData,
              });
              return;
            }
          } else {
            res.status(403).send({ message: "Id de local o foto invalido" });
            return;
          }
        } else {
          isModerador(authData.usuario._id).then(async (oResult) => {
            if (oResult) {
              if (
                isValidObjectId(req.body.idLocal) &&
                isValidObjectId(req.body.idFoto)
              ) {
                let eliminarFoto = await LocalComida.updateOne(
                  { _id: req.body.idLocal },
                  { $pull: { fotos: { _id: req.body.idFoto } } }
                );
                if (eliminarFoto.matchedCount != 0) {
                  res.status(200).send({
                    message: "Foto removida con éxito",
                    eliminarFoto,
                    authData,
                  });
                  return;
                } else {
                  res.status(200).send({
                    message: "Fallo al remover la foto",
                    eliminarFoto,
                    authData,
                  });
                  return;
                }
              } else {
                res
                  .status(403)
                  .send({ message: "Id de local o foto invalido" });
                return;
              }
            }
          });
        }
        res.status(403).send({ message: "Sin permisos para eso" });
      });
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});
//Dar de alta
//!FLAGS - ADMIN AND MODERADOR ONLY!
router.patch("/darDeAlta", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, (err, authData) => {
      if (!isValidObjectId(req.body.idLocal)) {
        res.status(400).send({ message: "Ese id es invalido." });
        return;
      }
      if (err) {
        res.status(403).send({ message: "Debes estar logeado para esto." }); //if there's an error veryfing, then send 403
      } else {
        isAdminOrModerador(authData.usuario._id).then(async (result) => {
          console.log(result);
          if (result) {
            let idDeBaja = await LocalComida.updateOne(
              { _id: req.body.idLocal },
              { $set: { estado: "ACTIVO" } }
            );
            if (idDeBaja.matchedCount != 0) {
              res.status(200).send({
                message: "Local dado de alta",
                idDeBaja,
                authData,
              });
              return;
            } else {
              res.status(400).send({
                message: "Local no encontrado.",
                idDeBaja,
                authData,
              });
              return;
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
//Dar de baja - ok
//!FLAGS - ADMIN AND MODERADOR ONLY!
router.patch("/darDeBaja", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, (err, authData) => {
      if (!isValidObjectId(req.body.idLocal)) {
        res.status(400).send({ message: "Ese id es invalido." });
        return;
      }
      if (err) {
        res.status(403).send({ message: "Debes estar logeado para esto." }); //if there's an error veryfing, then send 403
      } else {
        isAdminOrModerador(authData.usuario._id).then(async (result) => {
          console.log(result);
          if (result) {
            let idDeBaja = await LocalComida.updateOne(
              { _id: req.body.idLocal },
              { $set: { estado: "INACTIVO" } }
            );
            if (idDeBaja.matchedCount != 0) {
              res.status(200).send({
                message: "Local dado de baja",
                idDeBaja,
                authData,
              });
              return;
            } else {
              res.status(400).send({
                message: "Local no encontrado.",
                idDeBaja,
                authData,
              });
              return;
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
//Editar configuración local
//!FLAGS - ADMIN AND MODERADOR ONLY - OK
router.patch("/editar", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, (err, authData) => {
      if (err) {
        console.log(err);
        res.status(403).send({ message: "Error al autenticar" });
        return;
      }
      if (!isValidObjectId(req.body.idLocal)) {
        res.status(400).send({ message: "Object ID invalido" });
        return;
      }
      isAdminOrModerador(authData.usuario._id).then(async (result) => {
        if (result) {
          if (
            req.body.nombre == undefined ||
            req.body.coordenadas == undefined ||
            req.body.direccion == undefined
          ) {
            res.status(400).send({ message: "No se vale campos indefinidos" });
            return;
          }
          let editar = await LocalComida.updateOne(
            { _id: req.body.idLocal },
            {
              $set: {
                nombre: req.body.nombre,
                coordenadas: req.body.coordenadas,
                direccion: req.body.direccion,
              },
            }
          );
          if (editar.matchedCount != 0) {
            res
              .status(200)
              .send({ message: "Cambios realizados con éxito 👍" });
            return;
          } else {
            res.status(403).send({ message: "No se encontró ese ID 👎" });
          }
          return;
        }
        res.status(403).send({ message: "No autorizado" });
      });
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});
//Añadir califcaciones
//!FLAGS - PUBLIC REQUIRED LOGIN - OK
router.patch("/calificar", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, async (err, authData) => {
      if (err) {
        res.status(400).send({ message: "Error al autenticar" });
        return;
      }
      if (req.body.estreallas > 10 || req.body.estrellas < 0) {
        res
          .status(400)
          .send({ message: "Error, el rango de estrellas es 0-10" });
        return;
      }
      if (isValidObjectId(req.body.idLocal)) {
        let comentarios = await LocalComida.findById(req.body.idLocal);
        if (comentarios != null) {
          let idComentarios = comentarios.calificacion.map((item) => {
            return item.id_usuario;
          });
          if (idComentarios.includes(authData.usuario._id)) {
            res
              .status(200)
              .send({ message: "Este usuario ya comentó en este local." });
            return; //Parece que se sigue ejecutando el código de abajo
          }
        }
        let calificacion = {
          id_usuario: authData.usuario._id,
          comentario: req.body.comentario,
          estrellas: req.body.estrellas,
        };
        let comentarUsuario = await LocalComida.updateOne(
          { _id: req.body.idLocal },
          { $push: { calificacion: calificacion } }
        );
        if (comentarUsuario.matchedCount != 0) {
          res.status(400).send({
            message: "Calificado con éxito👍",
            comentarUsuario,
            authData,
          });
          return;
        }
        res.status(200).send({
          message: "ID no encontrado",
          comentarUsuario,
          authData,
        });
      } else {
        res.status(400).send({ message: "Id no valido" });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});
//Añadir plato al menú
//!FLAGS - PUBLIC REQUIRED LOGIN - OK
router.patch("/addMenu", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, async (err, authData) => {
      if (err) {
        res.status(400).send({ message: "Error en la autenticación" });
        return;
      }
      if (isValidObjectId(req.body.idLocal)) {
        if (
          req.body.nombre == undefined ||
          req.body.descripcion == undefined ||
          req.body.precio == undefined
        ) {
          res
            .status(400)
            .send({ message: "Error, no vale dejar campos vacios" });
          return;
        }
        //No verifica que ya exista ese nombre... el required no sirve por alguna razón, tendré que hacer algo a mano
        let platosActuales = await LocalComida.findById(req.body.idLocal);
        if (platosActuales != null) {
          let platosNombres = platosActuales.menu.map((item) => {
            return item.nombre;
          });
          if (platosNombres.includes(req.body.nombre)) {
            res.status(403).send({
              message: "Este plato ya existe en el menú, cambia el nombre.",
            });
            return; //Parece que se sigue ejecutando el código de abajo
          }
        }
        let nuevoMenu = {
          nombre: req.body.nombre,
          descripcion: req.body.descripcion,
          precio: req.body.precio,
          creador: authData.usuario._id,
        };
        let addMenu = await LocalComida.updateOne(
          { _id: req.body.idLocal },
          { $push: { menu: nuevoMenu } }
        );
        if (addMenu.matchedCount != 0) {
          res.status(200).send("Menú agregado con éxito 👍");
          return;
        }
        res
          .status(400)
          .send({ message: "No se pudo encontrar dicho ID de Local" });
      } else {
        res.status(400).send({ message: "Id no valido" });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});
//Delete del menú
//!FLAGS - ADMIN AND ADMINISTRADOR ONLY! - OK
router.delete("/eliminarDeMenu", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, (err, authData) => {
      if (err) {
        res.status(400).send({ message: "Error en la autenticación" });
        console.log(err);
      }
      isAdminOrModerador(authData.usuario._id).then(async (result) => {
        if (result) {
          if (
            isValidObjectId(req.body.idLocal) &&
            isValidObjectId(req.body.idMenu)
          ) {
            let eliminarDeMenu = await LocalComida.updateOne(
              { _id: req.body.idLocal },
              { $pull: { menu: { _id: req.body.idMenu } } }
            );
            if (eliminarDeMenu.matchedCount != 0) {
              res.status(200).send({
                message: "Menu removido con éxito",
                eliminarDeMenu,
                authData,
              });
              return;
            } else {
              res.status(400).send({
                message: "Fallo al remover del menú, ese id no existe",
                eliminarDeMenu,
                authData,
              });
              return;
            }
          } else {
            res.status(403).send({ message: "Id de local o menu invalido" });
            return;
          }
        } else {
          res.status(403).send({ message: "Sin permisos para eso" });
        }
      });
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});
//Add foto a menú existente.
//!FLAGS - PUBLIC REQUIRED LOGIN!
router.patch("/addFotoMenu", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, async (err, authData) => {
      if (!isValidObjectId(req.body.idLocal)) {
        res.status(403).send({ message: "El id no es valido" });
        return;
      }
      let nuevaFoto = {
        fotografo: authData.usuario._id,
        direccion: req.body.foto,
      };
      let local = await LocalComida.findById(req.body.idLocal);
      if (local != null) {
        let menuLocal = local.menu.map((item) => {
          if (item._id == req.body.idMenu) {
            dfg;
            item.foto.push(nuevaFoto);
          }
          return item;
        });
        let update = await LocalComida.updateOne(
          { _id: req.body.idLocal },
          { $set: { menu: menuLocal } }
        );
        if (update.modifiedCount != 0) {
          res.status(200).send({ message: "Foto guardada 👍", update });
          return;
        } else {
          res.status(400).send({
            message: "La foto no fue guardada, verifica el ID",
            update,
          });
          return;
        }
      } else {
        res.status(400).send({ message: "Ese ID de local no existe" });
      }
    });
  } catch {
    res.json({ message: err });
    console.log(err);
  }
});
//Add Sugerencia
//!FLAGS - PUBLIC REQUIRED LOGIN
router.patch("/addSugerencia", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, async (err, authData) => {
      if (err) {
        res
          .status(400)
          .send({ message: "Necesitas estar logeado para hacer esto" });
        return;
      }
      if (isValidObjectId(req.body.idLocal)) {
        let local = await LocalComida.findById(req.body.idLocal);
        if (local != null) {
          let idsSugerencias = local.sugerencias.map((item) => {
            return item.creador;
          });
          if (idsSugerencias.includes(authData.usuario._id)) {
            res
              .status(400)
              .send({ message: "Este usuario ya sugirió en este local." });
            return; //Parece que se sigue ejecutando el código de abajo
          }
        }
        let nuevaSugerencia = {
          creador: authData.usuario._id,
          sugerencia: req.body.sugerencia,
        };
        let pushSugerencia = await LocalComida.updateOne(
          { _id: req.body.idLocal },
          { $push: { sugerencias: nuevaSugerencia } }
        );
        if (pushSugerencia.matchedCount != 0) {
          res
            .status(200)
            .send({ message: "Comentado con éxito", pushSugerencia, authData });
          return;
        } else {
          res
            .status(400)
            .send({ message: "Ese local no existe", pushSugerencia, authData });
        }
      } else {
        res.status(400).send({ message: "El id del restaurante es invalido" });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});
//Add Bandera
//!FLAGS - LOGIN REQUIRED - ok
router.patch("/addBandera", verifyToken, (req, res) => {
  try {
    jwt.verify(req.token, secretkey, async (err, authData) => {
      if (err) {
        res.status(400).send({ message: "Error en la autorización" });
      }
      if (isValidObjectId(req.body.idLocal)) {
        if (req.body.tipo_bandera == false || req.body.tipo_bandera == true) {
          if (req.body.bandera.length > 12) {
            res
              .status(400)
              .send({
                message: "La bandera no puede tener más de 12 caracteres",
              });
            return;
          }
          if (req.body.bandera.length < 3) {
            res
              .status(400)
              .send({
                message: "La bandera debe ser de 3 caracteres como minimo",
              });
            return;
          }
          let nuevaBandera = {
            creador: authData.usuario._id,
            tipo_bandera: req.body.tipo_bandera,
            bandera: req.body.bandera,
          };
          let pushFlag = await LocalComida.updateOne(
            { _id: req.body.idLocal },
            { $push: { banderas: nuevaBandera } }
          );
          if (pushFlag.matchedCount != 0) {
            res
              .status(200)
              .send(
                { message: "Bandera establecida con éxito 👍" },
                pushFlag,
                authData
              );
            return;
          } else {
            res
              .status(400)
              .send(
                {
                  message:
                    "Fallo al establecer la bandera, no encontramos ese local 👎",
                },
                pushFlag,
                authData
              );
            return;
          }
        } else {
          res
            .status(400)
            .send({ message: "La bandera debe ser positiva o negativa" });
          return;
        }
      } else {
        res.status(400).send({ message: "Ese código no es valido." });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});
module.exports = router;
