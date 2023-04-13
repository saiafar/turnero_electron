const path = require('path');

const Cola = require('../Models/Cola.js');
const Config = require('../Models/Config.js');
const PrintPW = require("../printPW.js");
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
const moment = require('moment');
const fetch = require("node-fetch");
const https = require("https");

const TurnoDB = require('../Models/TurnoDB.js');
const ColaDB = require('../Models/ColaDB.js');

class ColaController{
    constructor(){
        this.viewsPath = path.join(__dirname, '../views');
    }

    create(req, res){
        let cola = null;
        if(req.query['cola'] != null){
            let colaid = req.query['cola'];
            cola = new Cola(colaid+'.json');
        }
        
        res.render(path.join(this.viewsPath,'new/new.ejs'), {cola: cola});
    }

    stats(req, res){
        console.log('desde---------->', req.query['desde']);
        let desde = "";
        let hasta = "";
        if(req.query['desde']){
            desde = req.query['desde'];
            hasta = req.query['hasta'];
        }else{
            desde = moment().day(0).format("YYYY-MM-DD");
            hasta = moment().day(6).format("YYYY-MM-DD");
        }
        let turnoDB  = new TurnoDB();
        turnoDB.connect();
        turnoDB.getTiempoEspera(desde, hasta, res, path.join(this.viewsPath,'stats/stats.ejs'));
        turnoDB.close();
        //res.render(path.join(this.viewsPath,'stats/stats.ejs'), {result:result, desde:desde, hasta:hasta});
    }

    statsData(req, res){
        let desde = req.query['desde'];
        let hasta = req.query['hasta'];
        let turnoDB  = new TurnoDB();
        turnoDB.connect();
        let result = turnoDB.getTiempoEspera('2020-11-23', '2020-11-29');
        turnoDB.close();
        socket.sockets.emit('stats:data:'+req.query['cola'], next);
        res.json(next);
    }

    async list(req, res){
        let cola = new ColaDB();
        await cola.connect();
        let colas = await cola.getAll();
        await cola.close();
        res.json(colas)
    }
    // Example method
    async listColas(req, res){
        let cola = new ColaDB();
        await cola.connect();
        let colas = await cola.getAll();
        await cola.close();
        res.json(colas)
    }

    // Example method
    async getColaDB(req, res){
        let colaDB = new ColaDB();
        await colaDB.connect();
        console.log('antes del query');
        let cola = await colaDB.get('test' , res);
        console.log('despues del query');
        await colaDB.close();
        res.json(colas);
    }

    async storage(req, res){
        let cola = new ColaDB();
        await cola.connect();
        cola.name = req.query['name'];
        cola.text = req.query['text'];
        cola.start = req.query['start'];
        cola.end = req.query['end'];
        cola.current =  cola.start;
        cola.ticketcurrent = cola.start;
        await cola.create();
        await cola.close();
        res.json('create');
    }

    configStorage(req, res){
        
        let config = new Config();
        console.log(req.query);
        config.port = req.query.port;
        config.pid = req.query.pid;
        config.printer = req.query.printer;
        config.typePrinter = req.query.typePrinter;
        config.showKiosko = req.query.showKiosko;
        config.showKioskoInSecondDisplay = req.query.showKioskoInSecondDisplay;
        config.colaKiosko = req.query.colaKiosko;
        config.useHost = req.query.useHost;
        config.host = req.query.host;
        config.save(); 
        this.config(req, res);
    }
    edit(){

    }
    update(){

    }

    delete(){

    }

    async next(socket, data){
        console.log('-------NEXT----------');
        console.log('DATA---', data);
        let balanza
        try{
            data=JSON.parse(data);
            balanza=data.nombre;
            
        }catch(error){
            let cola = new ColaDB();
            await cola.connect();
            await cola.get(data.cola);
        }
        
        

        let cola = new ColaDB();
        await cola.connect();
        await cola.get(data.cola);
        let next = parseInt(cola.current)+1;
        if(next <= parseInt(cola.ticketcurrent) || parseInt(cola.cycle) < parseInt(cola.ticketcycle) ){
            if(next > cola.end){
                next = cola.start; 
                cola.cycle = parseInt(cola.cycle)+1;
            }
            cola.current = next;
            cola.save();
        }else{
            next = -1;
        }

        let turnoDB  = new TurnoDB();
        turnoDB.connect();
        turnoDB.atendido(cola.name, next, cola.cycle, 'web');
        turnoDB.close();

        socket.sockets.emit('cola:show:'+data.cola, {data:next,balanza:balanza});
    }

    async nextBalanza(socket, req, res){
        let cola = new ColaDB();
        await cola.connect();
        await cola.get(data.cola);
        let puesto = req.query['puesto'];
        let next = parseInt(cola.current)+1;
        if(next <= parseInt(cola.ticketcurrent) || parseInt(cola.cycle) < parseInt(cola.ticketcycle) ){
            if(next > cola.end){
                next = cola.start; 
                cola.cycle = parseInt(cola.cycle)+1;
            }
               
            cola.current = next;
            cola.boothCall = puesto;
            cola.save();
        }else{
            next = -1;
        }

        let turnoDB  = new TurnoDB();
        turnoDB.connect();
        turnoDB.atendido(cola.name, next, cola.cycle, puesto);
        turnoDB.close();
        socket.sockets.emit('cola:show:'+req.query['cola'], {data:next,balanza:puesto});
        res.json(next);
    }

    async current(socket, data){
        console.log('data--->', data.cola);
        let balanza;
        //data.cola = data.cola.replace("'", "\"");
        try{
            balanza=data.nombre;
            let cola = new ColaDB();
            await cola.connect();
            await cola.get(data.cola);
            balanza=cola.boothCall;
            socket.emit('cola:show:'+data.cola, {data:cola.current,balanza:balanza});
        }catch(error){
            console.log('ERROR-->', error);    
        }
        
        //let cola = new Cola(data.cola+'.json');
        
    }

    async currentNew(socket, data){
        console.log("current new");
        let balanza;
        try{
            data=JSON.parse(data);
            balanza=data.balanza;
        }catch(error){
            let cola = new ColaDB();
            await cola.connect();
            await cola.get(data.cola);
            balanza=cola.boothCall;
        }
        socket.sockets.emit('cola:show:'+data.cola,{data:data.data,balanza:balanza});
    }

    kiosko(req, res){
        let params = req.query['cola'];
        params = params.split(',');
        res.render(path.join(this.viewsPath,'kiosko/kiosko.ejs'), {colas: params});
    }

    async control(req, res){
        /*let cola = new ColaDB();
        await cola.connect();
        await cola.get(req.params.cola);*/
        let cola = req.params.cola;
        res.render(path.join(this.viewsPath,'control/control.ejs'), {cola:cola});    
    }

    config(req, res){
        let config = new Config();
        var ip = req.headers['x-forwarded-for'] ||          
        req.socket.remoteAddress || 
        req.connection.socket.remoteAddress||        
        req.connection.remoteAddress;
        res.render(path.join(this.viewsPath,'config/config.ejs'), {config: config, ip:ip});    
    }

    async setTurno(socket, data){
        let cola = new ColaDB();
        await cola.connect();
        await cola.get(data.cola);
        let balanza=cola.boothCall;
        cola.current = data.turno;
        cola.save();
        socket.sockets.emit('cola:show:'+data.cola, {data:cola.current,balanza:balanza});
    }

    async reset(socket, data){
        let cola = new ColaDB();
        await cola.connect();
        await cola.get(data.cola);

        cola.current = cola.start;
        cola.cycle = 0;
        cola.ticketcurrent = cola.start;
        cola.ticketcycle=0;
        cola.save();
        socket.sockets.emit('cola:show:'+data.cola, {data:cola.current ,balanza:cola.boothCall});
    }

    async resetBalanza(socket, req, res){
        let cola = new ColaDB();
        await cola.connect();
        await cola.get(req.query['cola']);
        cola.current = cola.start;
        cola.cycle = 0;
        cola.ticketcurrent = cola.start;
        cola.ticketcycle=0;
        cola.save();
        socket.sockets.emit('cola:show:'+cola.name, {data:cola.current ,balanza:cola.boothCall});
        //res.json(next);
    }

   async  getTurn(socket, data){
        let config = new Config();
        let turno = -1;
        let text = '';
        let behind = 0;

        console.log('useHost', config.useHost);
        if(config.useHost == 0){

            let cola = new ColaDB();
            await cola.connect();
            await cola.get(data.cola);
            text = cola.text
            turno = parseInt(cola.ticketcurrent);
            if(turno == 0){
                turno = cola.start;
            }else{
                turno++;
                
                if(turno > cola.end){
                    turno = cola.start;
                    cola.ticketcycle = parseInt(cola.ticketcycle)+1;
                }
            }

            let turnoDB  = new TurnoDB();
            turnoDB.connect();
            turnoDB.initTurno(cola.name, turno, cola.ticketcycle);
            turnoDB.close();
            
            cola.ticketcurrent = turno;

            await cola.save();
            await cola.close();
            let auxTurno = turno;
            if(cola.ticketcycle > cola.cycle)
                auxTurno = parseInt(cola.ticketcurrent)+parseInt(cola.end);

            behind = parseInt(auxTurno) - parseInt(cola.current);

        }else{
            console.log('http://'+config.host+':3000/getTurnHost?cola='+data.cola);
            let response = await fetch('http://'+config.host+':3000/getTurnHost?cola='+data.cola);
            const resJson = await response.json();
            console.log('response', resJson.turno);
            turno = resJson.turno;
            text = resJson.text;
            behind = resJson.behind;
        }

        if(config.typePrinter == 1){
            this.printTurno(turno, text);
        }else if(config.typePrinter == 2){
            this.printTurno2(turno, text);
        }

        socket.emit('cola:behind', {turno: turno, behind: behind});
    }

    async  getTurnHost(req, res){
        console.log('getTurnHOST Controller');
        let cola = new ColaDB();
        await cola.connect();
        await cola.get(req.query['cola']);
        let turno = parseInt(cola.ticketcurrent);
        if(turno == 0){
            turno = cola.start;
        }else if((turno < cola.start)){
            turno = cola.start;
        }else{
            turno++;
            
            if(turno > cola.end){
                turno = cola.start;
                cola.ticketcycle = parseInt(cola.ticketcycle)+1;
            }
        }

        let turnoDB  = new TurnoDB();
        turnoDB.connect();
        turnoDB.initTurno(cola.name, turno, cola.ticketcycle);
        turnoDB.close();
        
        cola.ticketcurrent = turno;

        await cola.save();
        await cola.close();
        let auxTurno = turno;
        if(cola.ticketcycle > cola.cycle)
            auxTurno = parseInt(cola.ticketcurrent)+parseInt(cola.end);

        let behind = parseInt(auxTurno) - parseInt(cola.current);

        res.json({turno: turno, text: cola.text, behind: behind});
    }

    printTurno(turno, cola){
        let config = new Config();
        console.log(config.vid, config.pid);
        const device  = new escpos.USB(config.vid, config.pid);
        const options = { encoding: "GB18030"}
        const printer = new escpos.Printer(device, options);

        let now = new Date();
        let fecha = now.getDate() + "/" + (now.getMonth()) + "/" + now.getFullYear();
        let hora = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();

        device.open(function(err){
        
            printer
            .model('qsprinter')
            .encode('tis620')
            .font('a')
            .align('ct')
            .style('b')
            .size(2, 2)           
            .text('Turno')
            .size(8, 8)
            .text(turno)
            .size(2, 2)           
            .text(cola)
            .size(1, 1)
            .text(fecha+" "+hora)
            .text(' ')
            .text(' ')
            .cut()
            .close();
          });
    }

    printTurno2(turno, cola){
        let config = new Config();
        const printPW = new PrintPW()
          printPW.print({
            turno: turno,
            cola: cola
          },
          {
            preview: false, 
            silent:true,
            template:'etiqueta.html',
            printer: config.printer
          });
    }

    getInfoUSB(req, res){
        const device  = new escpos.USB();
        const options = { encoding: "GB18030"}
        const printer = new escpos.Printer(device, options);
        let data = escpos.USB.findPrinter()
        res.json(data);
    }

    async setBalanza(socket, data){
        let cola = new ColaDB();
        await cola.connect();
        await cola.get(data.cola);
        cola.boothCall = data.balanza;
        cola.save();
    }

}

module.exports = ColaController;