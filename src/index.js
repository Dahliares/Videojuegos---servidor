import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import { encriptar, comparar } from './crypt.js';
import mysql from 'mysql';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

const app = express();


//middelwares
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false, limit: '100mb' }));
app.use(bodyParser.json());

const upload = multer({ storage:multer.memoryStorage() });

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

    db.connect(function (err) {
        if (err) {
            console.log("Error de conexión con la bd:", err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log("Conectado correctamente a la bd");
        }
    });
    db.on("error", function (err) {
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

app.set('port', process.env.PORT || 5555)

app.listen(app.get('port'), "0.0.0.0", () => {
    console.log('Server on port ' + app.get('port'));
})



//rutas
// --------------------- JUEGOS --------------------------

//obtener todos los juegos
app.get('/', (req, res) => {
    db.query('SELECT * FROM videojuegos',
        (err, result) => {
            if (err) { console.log(err) }
            else { res.send(result); }
        })

});

//enviar un juego en contcreto por id
app.get('/videojuego/:id', (req, res) => {

    const params = req.params;

    db.query('SELECT * FROM videojuegos WHERE id = ' + params.id,
        (err, result) => {
            if (err) { console.log(err) }
            else { res.send(result); }
        })



});


//enviar todos los dibujos de un año concreto
app.get('/consola/:consola', (req, res) => {

    const params = req.params;

    db.query('SELECT * FROM videojuegos WHERE consola = ? ', params.consola,
        (err, result) => {
            if (err) { console.log(err) }
            else { res.send(result); console.log(result) }
        })



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


app.post('/add', upload.single('file'), (req, res) => {

    let formatoImg = req.file.mimetype.split('/')[1];

    let img = "data:image/" + formatoImg + ";base64," + req.file.buffer.toString('base64');
    let nombre = req.body.nombre;
    let consola = req.body.consola;
    let tipo = req.body.tipo;
    let saga = req.body.saga;
    let formato = req.body.formato;
    let idioma = req.body.idioma;
    let estado = req.body.estado;
    let compania = req.body.compania;
    let comentarios = req.body.comentarios;
    
    console.log(req.file);
    console.log(req.file.mimetype.split('/')[1]);
    


   db.query('INSERT INTO  videojuegos (nombre, consola, tipo, saga, formato, idioma, estado, compania, comentarios, img) VALUES (?,?,?,?,?,?,?,?,?,?)', 
   [nombre, consola, tipo, saga, formato, idioma, estado, compania, comentarios, img], (err, result) => {

        if (err) { 
            console.log(err) 
            res.send({"mensaje":"error"});
        }
        else {
            res.send({"mensaje":"juego insertado"});
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





