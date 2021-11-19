const express = require("express");
const app = express();
const mongoose = require("mongoose");
require('dotenv/config');
//import routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); //Reemplaza a bodyparser

const apiLocales = require('./routes/apiLocales');
app.use('/api/locales', apiLocales);
const apiUsuarios = require('./routes/apiUsuarios');
app.use('/api/usuarios', apiUsuarios);

//Db connection
mongoose.connect(
 process.env.DB_CONNECTION,
  { useNewUrlParser: true},
  () => {
    console.log("Conectado a base de datos.");
  }
);

//Execution
app.listen(3000);
