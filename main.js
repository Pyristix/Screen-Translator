const path = require('path')
const fs = require("fs");
const async = require("async");
const { app, BrowserWindow, ipcMain } = require('electron')

let settings = null;

function createWindow () {
	const win = new BrowserWindow({
		width: 550,
		height: 410,
		icon: "resources/images/icon.ico",
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	})
	win.setMenu(null);
	win.resizable = false;
	win.loadFile('resources/html/settings.html');
	win.openDevTools();
	
	async.series([
		function(callback) {
			loadSettings(callback);
		}, function(callback) {
			console.log(JSON.stringify(settings));
			callback(null, "two");
		}], 
	);
	
	ipcMain.on('language_1_selected', function (event, arg){
		console.log(arg);
	})
	
	ipcMain.on('language_2_selected', function (event, arg){
		console.log(arg);
	})
	
	ipcMain.on('translation_key_selected', function (event, arg){
		console.log(arg);
	})
	
	ipcMain.on('timer_interval_selected', function (event, arg){
		console.log(arg);
	})
	
	ipcMain.on('scroll_translate_input_changed', function (event, arg){
		console.log(arg);
	})
	
	ipcMain.on('time_translate_input_changed', function (event, arg){
		console.log(arg);
	})
	
	ipcMain.on('settings_submitted', function (event, arg){
		console.log("Submitted");
	})
}

function saveSettings () {
	fs.writeFile("config.json", JSON.stringify(settings), (err) => {
		if(err) 
			console.log(err);
		else
			console.log("Settings saved")
	});
}

function loadSettings (callback) {
	fs.readFile("config.json", function(err, buf) {
		if (err)
			console.log(err);
		else{
			settings = JSON.parse(buf);
			callback(null, "one");
		}
	})
}

function saveDefaultSettings () {
	fs.writeFile("config.json", JSON.stringify(
		{language_1: "JP", 
		 language_2: "EN", 
		 translation_key: "Ctrl+;", 
		 timer_interval: 5, 
		 scroll_translate: false, 
		 timer_translate: true}), 
		(err) => {if(err) console.log(err); console.log("Settings saved")
	});
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


if (process.platform === 'darwin'){
	app.whenReady().then(() => {
	  createWindow()

	  app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	  })
	})
}