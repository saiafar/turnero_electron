const electron = require('electron');
const path = require('path');
const userDataPath = electron.app.getPath('userData');

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');


class ColaDB{


    constructor(){
        this.dbname = path.join(userDataPath,'turnos.db');
        this.db = null;
        this.data = "";
        this.name = '';
        this.texto = '';
        this.start = 0;
        this.end = 0;
        this.current = 0;
        this.cycle = 0;
        this.ticketcurrent = 0;
        this.boothCall = '';
        this.ticketcycle=0;
    } 

    async connect(){
        let filenameBD = this.dbname;
        console.log("DATABASE FILE--------->",filenameBD);
        this.db = await open({
            filename: filenameBD,
            driver: sqlite3.Database
         });
        
        /*this.db = new sqlite3.Database(this.dbname, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
        , (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Connected to the chinook database.');
            }
        });*/
    }

    async createTable(){
        console.log("CREATE ->>");
        await this.db.exec(`CREATE TABLE IF NOT EXISTS colas(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            texto TEXT,
            start INTEGER,
            end INTEGER,
            current INTEGER,
            cycle INTEGER,
            ticketcurrent INTEGER,
            boothCall TEXT,
            ticketcycle INTEGER
        )`);
    }

    async close(){
        try{
            await this.db.close();
        }catch(err){
            console.error(err.message); 
        }
        
        console.log('Close the database connection.');
    }

    async getAll(){
        const result = await this.db.all('SELECT * FROM colas')
        return result;
    }

    async get(cola){
        let row = null;
        try{
            console.log('COLA -------->',cola)
            row = await this.db.get('select * from colas where name = ?', [cola]); 
            console.log('COLA2 -------->',cola)
            this.name = row.name;
            this.text = row.texto;
            this.start = row.start;
            this.end = row.end;
            this.current = row.current;
            this.cycle = row.cycle;
            this.ticketcurrent = row.ticketcurrent;
            this.ticketcycle = row.ticketcycle;
            this.boothCall = row.boothCall;
        }catch(error){
            console.log(error);
        }
    }

    async create(){
         await this.db.run(`INSERT INTO colas (name, texto, start, end,  current, cycle, ticketcurrent, boothCall, ticketcycle)
        VALUES (?, ?, ?, ? ,?, ?, ? ,? ,?)`, [this.name,
            this.text,
            this.start,
            this.end,
            this.current,
            this.cycle,
            this.ticketcurrent,
            this.boothCall,
            this.ticketcycle
        ]);
    }

    async save(){
        console.log('en el save ---------------------');
        await this.db.run(`UPDATE colas SET name=?,
            texto = ?,
            start = ?,
            end = ?,
            current = ?,
            cycle = ?,
            ticketcurrent = ?,
            boothCall = ?,
            ticketcycle = ?   WHERE name = ?`, [this.name,
            this.text,
            this.start,
            this.end,
            this.current,
            this.cycle,
            this.ticketcurrent,
            this.boothCall,
            this.ticketcycle,
            this.name
        ]);
    

    }
}

module.exports = ColaDB;