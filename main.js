const async = require("async");
const fs = require("fs");
const path = require("path");
const screenshot = require("screenshot-desktop");
const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");

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
	win.loadFile("resources/html/settings.html");
	win.openDevTools();
	
	async.series([
		function(callback) {
			loadSettings(callback);
		}, function(callback) {
			console.log(JSON.stringify(settings));
			win.webContents.on("did-finish-load", () => {win.webContents.send("initial_settings", settings);});
			globalShortcut.register(settings.translation_key, () => {translateScreen()});
			callback(null, "two");
		}], 
	);
	
	setIpcListeners();
}

function translateScreen() {
	screenshot({filename: "./resources/screen.png"});
}

//Saves settings to config.json
function saveSettings() {
	fs.writeFile("config.json", JSON.stringify(settings), (err) => {
		if(err) 
			console.log(err);
		else
			console.log("Settings saved");
	});
}

//Loads settings from config.json into settings object
function loadSettings(callback) {
	fs.readFile("config.json", function(err, buf) {
		if (err)
			console.log(err);
		else{
			settings = JSON.parse(buf);
			callback(null, "one");
		}
	})
}

//Saves default settings to config.json
function saveDefaultSettings() {
	fs.writeFile("config.json", JSON.stringify(
		{language_1: "JA", 
		 language_2: "EN", 
		 translation_key: "Ctrl+Shift+A", 
		 timer_interval: 5, 
		 scroll_translate: false, 
		 timer_translate: true}), 
		(err) => {if(err) console.log(err); console.log("Settings saved");}
	);
}

//Sets ipc event listeners to listen for changes to settings and change settings object appropriately
function setIpcListeners() {
	ipcMain.on("language_1_selected", function(event, arg) {
		console.log(arg);
		settings.language_1 = arg;
	});
	
	ipcMain.on("language_2_selected", function(event, arg) {
		console.log(arg);
		settings.language_2 = arg;
	});
	
	ipcMain.on("translation_key_selected", function(event, arg) {
		console.log(arg);
		if(settings.translation_key !== "")
			globalShortcut.unregister(settings.translation_key);
		settings.translation_key = arg;
		if(settings.translation_key !== "")
			globalShortcut.register(settings.translation_key, () => {translateScreen()});
	});
	
	ipcMain.on("timer_interval_selected", function(event, arg) {
		console.log(arg);
		settings.timer_interval = arg;
	});
	
	ipcMain.on("scroll_translate_input_changed", function(event, arg) {
		console.log(arg);
		settings.scroll_translate = arg;
	});
	
	ipcMain.on("time_translate_input_changed", function(event, arg) {
		console.log(arg);
		settings.timer_translate = arg;
	});
	
	ipcMain.on("settings_submitted", function(event, arg) {
		saveSettings();
		console.log("Submitted");
		console.log(JSON.stringify(settings));
	});
}

//Creates window when the app is ready
app.whenReady().then(() => {
	createWindow();
})

//Closes window when all windows are closed
app.on("window-all-closed", function() {
	if (process.platform !== "darwin") 
		app.quit();
})