const electron = require('electron');
const path = require('path');
const userDataPath = electron.app.getPath('userData');

const sqlite3 = require('sqlite3').verbose();

const Cola = require('./Cola.js');

class TurnoDB{
    constructor(){
        this.dbname = path.join(userDataPath,'turnos.db');
        this.db = null;
    } 

    connect(){
        this.db = new sqlite3.Database(this.dbname, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
        , (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Connected to the chinook database.');
            }
        });
    }

    createTable(){
        this.db.run(`CREATE TABLE IF NOT EXISTS turnos(
            id INTEGER PRIMARY KEY,
            puesto TEXT,
            cola TEXT,
            turno  INTEGER,
            ciclo INTEGER,
            tomo TEXT,
            atendido TEXT
            )`);
    }

    close(){
        this.db.close((err) => {
            if (err) {
              console.error(err.message);
            }
            console.log('Close the database connection. turnoDB');
          });
    }

    initTurno(cola, turno, ciclo){
        this.db.run(`INSERT INTO turnos(cola, turno, ciclo, tomo) VALUES(?, ? ,?, datetime('now'))`, [cola, turno, ciclo], function(err) {
            if (err) {
              return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
          });
    }

    atendido(cola, turno, ciclo, puesto){
        console.log( [puesto, cola, turno, ciclo]);
        this.db.run(`UPDATE turnos SET puesto=?, atendido=datetime('now') WHERE cola=? AND ciclo=? AND turno=? AND atendido IS NULL`, [puesto, cola, ciclo, turno], function(err) {
            if (err) {
                return console.log(err.message);
            }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
        });
    }

    getTiempoEspera(desde, hasta, res, path){
        this.db.serialize(() => {
            this.db.all(`select cola, puesto, tomo, atendido, strftime('%H:%M:%S',CAST ((julianday(atendido) - julianday(tomo)) AS REAL),'12:00:00') as espera from turnos WHERE date(atendido) BETWEEN '${desde}' AND '${hasta}' AND atendido IS NOT NULL`, (err, rows) => {
              if (err) {
                console.error(err.message);
              }
              console.log(rows);
              res.render(path, {result:JSON.stringify(rows), desde:desde, hasta:hasta});
            });
        });

        /*let $result = await this.db.all(`select cola, puesto, tomo, atendido, strftime('%H:%M:%S',CAST ((julianday(atendido) - julianday(tomo)) AS REAL),'12:00:00') as espera from turnos WHERE date(atendido) BETWEEN '${desde}' AND '${hasta}'`);
        return $result;*/
    }

    checkReset(cola){
        
        this.db.all(`select atendido from turnos WHERE cola='${cola.name}' and date(atendido) == date('now')`, (err, rows) => {
              if (err) {
                console.error(err.message);
              }
              console.log('---------',rows);
              if(rows.length == 0){
                console.log('reset cola', cola.name);
                cola.current = cola.start;
                cola.cycle = 0;
                cola.ticketcurrent = 0;
                cola.boothCall = '';
                cola.ticketcycle=0;
                cola.save();
              }else{
                  console.log('no reset Cola');
              }
              global.checkResetCola();
              //res.render(path, {result:JSON.stringify(rows), desde:desde, hasta:hasta});
          
            }); 
    }
}

module.exports = TurnoDB;