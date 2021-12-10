const express = require("express");
const app = express();
const mongoose = require("mongoose");
//Basico arriba
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
    { useNewUrlParser: true },
    (error) => {
      if (error) {
        throw new Error(error);
      }
      console.log("Conectado a base de datos.");
    }
  );
} catch (error) {
  console.log(error);
  console.log("Error al conectar a la base de datos.");
}
//Execution
app.listen(3000, () => {
  console.log("Corriendo en puerto 3000");
});
