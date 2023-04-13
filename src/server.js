const express =  require('express');

const url = require('url');
const path = require('path');
const Cola = require('./Models/Cola.js');
const Config = require('./Models/Config.js');
const ColaController = require('./Controllers/ColaController.js');
const socketIO = require('socket.io');

const escpos = require('escpos');
const USB = require('usb');


class Server{
    constructor(){
        this.appex = express();
        //let appex=null
        this.server = null
        this.socket = null

        this.startExpress();
        this.routes();

        this.startSocket();
        this.socketConections();
    }

    startExpress(){
        let config = new Config();
        //settings
        this.appex.set('port', process.env.PORT || config.port);

        this.server = this.appex.listen(this.appex.get('port'), () => {
            console.log('server on port', this.appex.get('port'));
        })
    }

    startSocket(){
        this.socket = socketIO(this.server);
    }

    routes(){
        this.appex.use(express.static(path.join(__dirname, 'public')));

        this.appex.get('/control/:cola', (req, res) => {
            let control = new ColaController();
            control.control(req, res);
        });
        
        this.appex.get('/crear', (req, res) => {
            let control = new ColaController();
            control.create(req, res);
        });

        this.appex.get('/list', (req, res) => {
            let control = new ColaController();
            control.list(req, res);
        });
        
        this.appex.get('/list-colas', (req, res) => {
            let control = new ColaController();
            control.listColas(req, res);
        });
        
        this.appex.get('/get-cola-db', (req, res) => {
            let control = new ColaController();
            control.getColaDB(req, res);
        });
        
        this.appex.get('/storage', (req, res) => {
            let control = new ColaController();
            control.storage(req, res);
        });

        this.appex.get('/kiosko', (req, res) => {
            let control = new ColaController();
            control.kiosko(req, res);
        });

        this.appex.get('/config', (req, res) => {
            let control = new ColaController();
            control.config(req, res);
        });

        this.appex.get('/stats', (req, res) => {
            let control = new ColaController();
            control.stats(req, res);
        });

        this.appex.get('/colas', (req, res) => {
            let control = new ColaController();
            control.stats(req, res);
        });

        this.appex.get('/config/save', (req, res) => {
            let control = new ColaController();
            control.configStorage(req, res);
        });

        this.appex.get('/findusb', (req, res) => {
            let control = new ColaController();
            control.getInfoUSB(req, res);
        });

        /* URL para balanzas**/
        this.appex.get('/next', (req, res) => {
            let control = new ColaController();
            control.nextBalanza(this.socket, req, res);
        });

        this.appex.get('/reset', (req, res) => {
            let control = new ColaController();
            control.resetBalanza(this.socket, req, res);
        });


        this.appex.get('/getTurnHost', (req, res) => {
            let control = new ColaController();
            control.getTurnHost(req, res);
        });

    }

    socketConections(){
       // let io = this.socket;
        this.socket.on('connection', (socket) => {
            console.log('new conection', socket.id);
        
            socket.on('cola:setturno', (data) => {
                let control = new ColaController();
                control.setTurno(this.socket, data);
            })

            socket.on('cola:reset', (data) => {
                let control = new ColaController();
                control.reset(this.socket, data);
            })
        
            socket.on('cola:current', (data) => {
                let control = new ColaController();
                let current = control.current(socket, data);
            })

            socket.on('cola:current:new', (data) => {
                let control = new ColaController();
                 control.currentNew(this.socket, data);
            })

            socket.on('cola:next', (data) => {
                let control = new ColaController();
                control.next(this.socket, data);
            })
        
            socket.on('cola:getTurn', (data) => {
                let control = new ColaController();
                control.getTurn(socket, data);
            })

            socket.on('cola:setbalanza', (data) => {
                let control = new ColaController();
                control.setBalanza(this.socket, data);
            })
        })
    }

}

module.exports = Server;