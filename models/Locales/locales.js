const mongoose = require("mongoose");
const Fotitos = mongoose.Schema({
  fotografo: {
    type: String,
    required: true
  },
  direccion: {
    type: String,
    required: true
  }
});
const Sugerencia = mongoose.Schema({
  creador: {
    type: String,
    required: true
  },
  sugerencia: {
    type: String,
    required: true
  }
});
const Bandera = mongoose.Schema({
  creador: {
    type: String,
    required: true
  },
  tipo_bandera:{
    type: Boolean,
    required: true
  },
  bandera: {
    type: String,
    required: true
  }
});

const Menu = mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true
  },
  foto: {
    type: [Fotitos],
    required: false
  },
  descripcion: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true
  },
  //Default now porque al momento de subir se debe verificar
  fecha_verificado: {
    type: Date,
    default: Date.now
  },
  creador: {
    type: String,
    required: true
  }
});

const L_Calificaciones = mongoose.Schema({
  id_usuario: {
    type: String,
    required: true,
  },
  comentario: {
    type: String,
    required: false,
  },
  estrellas: {
    type: Number,
    required: true
  }
});
const LocalSchema = mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  direccion: {
    type: String,
    required: true,
  },
  //Direcciones de fotos del local, es público, no es requerido
  fotos: {
    type: [Fotitos],
    required: false,
  },
  coordenadas: {
    type: String,
    required: true,
  },
  estado: {
    type: String,
    default: "ACTIVO",
  },
  calificacion: {
    type: [L_Calificaciones],
    required: false,
  },
  //Porque el menu es false? porque quizá no se subió nada y porque quizá el menu varia, además, no siempre tendremos un usuario que suba esto.
  menu: {
    type: [Menu],
    required: false
  },
  //No siempre habrá sugerencias
  sugerencias: {
    type: [Sugerencia],
    required: false
  },
  banderas: {
    type: [Bandera],
    required: false
  },
  creador: {
    type: String,
    required: true
  }
});
module.exports = mongoose.model('Locales', LocalSchema);