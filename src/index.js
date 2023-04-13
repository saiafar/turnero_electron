const electron = require('electron')
const {app, BrowserWindow, Tray, Menu} = electron
//const {app, BrowserWindow, Menu, Tray} = require('electron');
const express =  require('express');
const appex = express();
//const url = require('url');
const path = require('path');
//const fs = require('fs');
const fetch = require('node-fetch');
//const http = require('http');
var AutoLaunch = require('auto-launch');

//const Cola = require('./Models/Cola.js');
const TurnoDB = require('./Models/TurnoDB.js');
const ColaDB = require('./Models/ColaDB.js');
const Config = require('./Models/Config.js');

var os = require("os");

const Server = require('./server.js');


//const userDataPath = app.getPath('userData');

console.log(os.hostname());

global.checkResetCola = ()=>{
    console.log('desde global --->', global.colaToReset.length);
    if(global.indexColaReset < global.colaToReset.length){
        let turnoDB = new TurnoDB();
        turnoDB.connect();
        turnoDB.checkReset(global.colaToReset[global.indexColaReset++]);
        turnoDB.close();
    }
    
}

global.colaToReset = [];
global.indexColaReset = 0;


let turnoDB = new TurnoDB();
let cola = new ColaDB();
colas = cola.getAll();
turnoDB.connect();
turnoDB.createTable();

let checktableColas = async ()=>{
    console.log('inicializanco colas')
    await cola.connect();
    await cola.createTable();
    await cola.close();
}

checktableColas();

turnoDB.close();


let mainWindow = null;
let tray = null;

const  gotTheLock =  app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit()
  }else{
    app.on('ready', () => {
        let config = new Config();
        let autoLaunch = new AutoLaunch({
            name: 'Turnero',
            path: app.getPath('exe'),
        });

        autoLaunch.isEnabled().then((isEnabled) => {
            if (!isEnabled) autoLaunch.enable();
        });

        console.log("dirname", __dirname);
        serExpress = new Server();
        tray = new Tray(path.join(__dirname, 'icon','icon.ico'))
        
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Configuracion', click:function(){
                mainWindow.show();
            }},
            { label: 'Salir',  click:function(){
                process.exit();
            }}
        ])
        tray.setToolTip('Turnomatic')
        tray.setContextMenu(contextMenu)
        
        
        /* ventana kiosko */
        if(config.showKiosko == '1'){
            if(config.showKioskoInSecondDisplay == '1'){
                let displays = electron.screen.getAllDisplays()
                let externalDisplay = displays.find((display) => {
                    return display.bounds.x !== 0 || display.bounds.y !== 0
                })

                if (externalDisplay) {
                    kioskoWindow = new BrowserWindow({
                      x: externalDisplay.bounds.x + 50,
                      y: externalDisplay.bounds.y + 50,
                      icon: path.join(__dirname, 'icon','icon.png')
                    })
                }else{
                    kioskoWindow = new BrowserWindow({ icon:path.join(__dirname, 'icon','icon.png')});
                }
            }else{
                kioskoWindow = new BrowserWindow({icon:path.join(__dirname, 'icon','icon.png')});
            }

            kioskoWindow.setFullScreen(true)
            kioskoWindow.removeMenu()
            kioskoWindow.loadURL('http://localhost:3000/kiosko?cola='+config.colaKiosko);

        }




        /* Windows Config */
        mainWindow = new BrowserWindow({show:false})
        mainWindow.loadURL('http://localhost:3000/config');

        mainWindow.on('minimize', function(event){
            event.preventDefault();
            mainWindow.hide();
        })

        mainWindow.on('close', function(event){
            if(!app.isQuiting){
                event.preventDefault();
                mainWindow.hide();
            }

            return false;
        })



        /*mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'views', 'index.hmtl'),
            protocol: 'http',
            slashes: true
        }))*/
    });
}