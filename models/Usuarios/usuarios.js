const mongoose = require('mongoose');
const { boolean } = require('webidl-conversions');
const Calificaciones = mongoose.Schema({
  id_usuario: {
    type: String,
    required: true
  },
  comentario: {
    type: String,
    required: true
  },
  //Las estrellas son del 0 al 10, cada punto es media estrella, esto nos da un 5/5
  estrellas: {
    type: Number,
    required: true
  }
});
const UsuarioSchema = mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  //Un string, default es USUARIO, deberíamos poner moderador y administrador
  nivel: {
    type: String,
    default: "USUARIO"
  },
  correo: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  usuario: {
    type: String,
    required: true,
    unique: true
  },
  //Default activo, siempre activo, a no ser que busquemos validaciones de correo en el futuro
  estado: {
    type: String,
    default: "ACTIVO"
  },
  //Acá pondría string, pero es relativamente fácil convertir un date a string. Que el post se encargue de esto
  fecha_nacimiento: {
    type: Date,
    required: true
  },
  //Este argumento es opcional, por lo tanto el default es ""
  ciudad:{
    type: String,
    default: "",
  },
  comentario_perfil: {
    type: String,
    default: ""
  },
  //Varias calificaciones del usuario, por eso un array.
  calificacion: {
    type: [Calificaciones],
    required: false
  },
  filtro_lenguaje: {
    type: Boolean,
    default: true
  },
  //Esto es una dirección en el servidor
  foto_perfil: {
    type: String,
    default: ""
  }
});
module.exports = mongoose.model('Usuarios', UsuarioSchema);