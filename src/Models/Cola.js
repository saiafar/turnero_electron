const electron = require('electron');
const path = require('path');
const userDataPath = electron.app.getPath('userData');
const fs = require('fs');

class Cola{
    constructor(){
        this.filename = "";
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
        try {
            fs.statSync(path.join(userDataPath, 'data'));
        } catch(e) {
            fs.mkdirSync(path.join(userDataPath, 'data'));
        }
        this.dataDirectory = path.join(userDataPath, 'data');
        if(arguments.length > 0){
            this.filename = arguments[0];
            this.get();
        }
        this.colas = [];
    }

    write(data){
        fs.writeFileSync(path.join(this.dataDirectory, this.filename), JSON.stringify(data));
    }

    read(filename){
        if (fs.existsSync(path.join(this.dataDirectory, this.filename))) {
            let data = fs.readFileSync(path.join(this.dataDirectory, this.filename), "utf8");
            data = (data != '')?JSON.parse(data):'';
            return data;
        }else{
            return false
        }
    }

    getAll(){
        let files = fs.readdirSync(this.dataDirectory);
        let colas = [];
        /*fs.readdir(this.dataDirectory, function (err, files) {
            //handling error
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            } 
            //listing all files using forEach
            files.forEach(function (file) {
                console.log(file);
                // Do whatever you want to do with the file
                let col = new Cola(file);
                this.colas.push(col);
            });
        });*/

        files.forEach(function (file) {
            // Do whatever you want to do with the file
            let col = new Cola(file);
            colas.push(col);
        });
        return colas;
    }

    get(){
        let data;
        if(data = this.read(this.filename)){
            this.name = data.name;
            this.text = data.text;
            this.start = data.start;
            this.end = data.end;
            this.current = data.current;
            this.cycle = data.cycle;
            this.ticketcurrent = data.ticketcurrent;
            this.ticketcycle = data.ticketcycle;
            this.boothCall = data.boothCall;
        }
    }

    save(){
        this.filename = this.name+'.json';
        this.data = {name: this.name, text: this.text, start:this.start, end:this.end, current:this.current, cycle:this.cycle, ticketcurrent: this.ticketcurrent, ticketcycle: this.ticketcycle, boothCall:this.boothCall};
        this.write(this.data);
    }
}

module.exports = Cola;