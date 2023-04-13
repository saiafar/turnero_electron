const electron = require('electron');
const path = require('path');
const userDataPath = electron.app.getPath('userData');
const fs = require('fs');

class Config{
    constructor(){
        this.filename = 'config.json';
        this.port = 3000;
        this.vid = 0;
        this.pid = 0;
        this.printer = "";
        this.typePrinter = 1;
        this.dataDirectory = userDataPath;
        this.showKiosko = false;
        this.showKioskoInSecondDisplay = false;
        this.colaKiosko = "";
        this.useHost = 0;
        this.host = "";
        this.get();
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

    get(){
        let data;
		if(data = this.read(this.filename)){
            this.port = data.port;
            this.pid = data.pid;
            this.vid = data.vid;
            this.printer = data.printer;
            this.typePrinter = data.typePrinter;
            this.showKiosko = data.showKiosko;
            this.showKioskoInSecondDisplay = data.showKioskoInSecondDisplay;
            this.colaKiosko = data.colaKiosko;
            this.useHost = ((typeof data.useHost !== 'undefined')?data.useHost:0) ;
            this.host = ((typeof data.host!== 'undefined')?data.host:'');
        }
    }

    save(){
        this.data = {
            port: this.port, 
            vid:this.vid, 
            pid:this.pid, 
            printer:this.printer,
            typePrinter:this.typePrinter,
            showKiosko:this.showKiosko,
            showKioskoInSecondDisplay:this.showKioskoInSecondDisplay,
            colaKiosko: this.colaKiosko,
            useHost: this.useHost,
            host: this.host
        };
        this.write(this.data);
    }
}

module.exports = Config;