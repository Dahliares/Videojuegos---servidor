import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import { encriptar, comparar } from './crypt.js';
import mysql from 'mysql';
import dotenv from 'dotenv';
dotenv.config();

const app = express();


//middelwares
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//DB CONEXIÓN

let db;
const configuration = {
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DBNAME
  }
function handleDisconnect() {
    db = mysql.createConnection(configuration);
  
    db.connect(function(err) {
      if (err) {
        console.log("Error de conexión con la bd:", err);
        setTimeout(handleDisconnect, 2000);
      }else{
          console.log("Conectado correctamente a la bd");
      }
    });
    db.on("error", function(err) {
      console.log("db error", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        handleDisconnect();
      } else {
        throw err;
      }
    });
  }
  handleDisconnect();

//configuraciones

app.set('port', process.env.PORT || 3333)

app.listen(app.get('port'), "0.0.0.0",() => {
    console.log('Server on port ' + app.get('port'));
})


//rutas
// --------------------- DIBUJOS --------------------------

//obtener todos los dibujos
app.get('/', (req, res) => {
    db.query('SELECT * FROM dibudahlia ORDER BY year DESC',
        (err, result) => {
            if (err) { console.log(err) }
            else { res.send(result); }
        })

});

//enviar un dibujo en contcreto por id
app.get('/dibujo/:id', (req, res) => {

    const params = req.params;

    db.query('SELECT * FROM dibudahlia WHERE id = ' + params.id,
        (err, result) => {
            if (err) { console.log(err) }
            else { res.send(result); }
        })



});


//enviar todos los dibujos de un año concreto
app.get('/year/:year', (req, res) => {

    const params = req.params;

    db.query('SELECT * FROM dibudahlia WHERE year = ? ', params.year,
        (err, result) => {
            if (err) { console.log(err) }
            else { res.send(result); console.log(result) }
        })



});


// --------------- COMENTARIOS ------------------------------

app.get('/comentarios/:id', (req, res) => {

    const params = req.params;

    db.query('SELECT * FROM comentarios WHERE dibujo_id = ? ', params.id,
        (err, result) => {
            if (err) { console.log(err) }
            else { 
                res.send(result); 
                console.log(result) }
        })


});


//guardar nuevo comentario
app.post("/comentario", async (req, res) => {

    const id = req.body.id;
    const user = req.body.user;
    const comentario = req.body.comentario;
    
    
    db.query('INSERT INTO comentarios (user, comentario, dibujo_id) VALUES (?,?,?)', [user, comentario, id], (err, result) => {
        if (err) { console.log(err); }
        else { res.send({"mensaje":"Comentario guardado!"}) }
    });

});


// ---------------- REGISTER + LOGIN ----------------------------------


//registrar usuario encriptando contraseña
app.post("/register", async (req, res) => {

    const username = req.body.username;
    const pass = req.body.pass;

    let hashPassword = await encriptar(pass);

    db.query('INSERT INTO users (username, password) VALUES (?,?)', [username, hashPassword], (err, result) => {
        if (err) { console.log(err); }
        else { res.send("User registrado con exito") }
    });

});

//comprobar que la contraseña es correcta al hacer login siempre que usuario exista
app.post('/login', (req, res) => {

    const username = req.body.username;
    const pass = req.body.pass;


    db.query('SELECT * FROM users WHERE username = ?', username,
        async (err, result) => {
            if (err) { console.log(err) }
            else {

                if (result.length < 1) {
                    res.send("Ese usuario no existe")
                } else {
                    let hashedpass = result[0].password;
                    let esCorrecto = await comparar(pass, hashedpass);
                    res.send(esCorrecto);
                }

            }
        });

});





/*app.put('/resetpass', (req, res) => {


   const username = req.body.username;
   const pass = req.body.pass;

    let hashPassword = await encriptar(pass);

    db.query('INSERT INTO users (username, password) VALUES (?,?)', [username, hashPassword], (err, result) => {
        if (err) { console.log(err); }
        else { res.send("User registrado con exito") }
    });


});*/





//cambiar la contraseña de un usuario
app.post('/resetpass', (req, res) => {

    const username = req.body.username;
    const newpass = req.body.pass;


    db.query('SELECT * FROM users WHERE username = ?', username,
        async (err, result) => {
            if (err) { console.log(err) }
            else {

                if (result.length < 1) {
                    res.send("Ese usuario no existe")
                } else {
                    let hashedpass = await encriptar(newpass);

                    db.query('UPDATE users SET password = ? WHERE username = ?', [hashedpass, username],
                        async (err, result) => {
                            if (err) { console.log(err) }
                            else {
                                res.send("Contraseña cambiada con éxito")
                            }

                        });
                }
            }
        });


});





