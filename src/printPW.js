"use strict";

const electron = require('electron');
const path = require("path")
const { app, BrowserWindow, ipcMain } = electron;
const userDataPath = (electron.app || electron.remote.app).getPath('userData');


class PrintPW{
    constructor(){
		this.options = {}
	}

    print(data, options){
        // open electron window
        let mainWindow = new BrowserWindow({
            width: 400,
            height: 600,
            show: !!options.preview,
            webPreferences: {
                nodeIntegration: true,        // For electron >= 4.0.0
            }
        });

        mainWindow.on('closed', function () {
            mainWindow = null;
        });

        mainWindow.loadFile(path.join(userDataPath, 'print_templates', options.template));

        mainWindow.webContents.on('did-finish-load', async () => {
            console.log("preview 111", options.preview);
            await sendIpcMsg('body-init', mainWindow.webContents, data);

            console.log("preview", options.preview);
            if(!options.preview){
                console.log("no preview")
                mainWindow.webContents.print({
                    silent: !!options.silent,
                    marginType: 1,
                    printBackground: true,
                    deviceName: options.printer,
                    copies: options.copies ? options.copies : 1,
                    pageSize: {
                        height: 454,
                        width: 471
                      }
                })
            }
        });
    }
    
}

function sendIpcMsg(channel, webContents, arg) {
    return new Promise(function (resolve, reject) {
        ipcMain.once(channel + "-reply", function (event, result) {
            console.log("en el reply--------");
            if (result.status) {
                resolve(result);
            }
            else {
                reject(result.error);
            }
        });
        webContents.send(channel, arg);
    });
}

module.exports = PrintPW;
