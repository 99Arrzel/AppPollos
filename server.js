const express = require("express");
const app = express();
const mongoose = require("mongoose");
//Basico arriba
const cors = require("cors");
const passport = require("passport");

require("dotenv/config");
//import routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); //Reemplaza a bodyparser

const apiLocales = require("./routes/apiLocales");
app.use("/api/locales", apiLocales);
const apiUsuarios = require("./routes/apiUsuarios");
app.use("/api/usuarios", apiUsuarios);

//Db connection
try {
  mongoose.connect(
    process.env.DB_CONNECTION,
    { useNewUrlParser: true},
    () => {
      console.log("Conectado a base de datos.");
    }
  );
} catch (error) {
  console.log(error);
  console.log("Error al conectar a la base de datos.");
}
//Execution
app.listen(3000);
