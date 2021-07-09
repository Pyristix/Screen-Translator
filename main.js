const path = require('path')
const fs = require("fs");
const async = require("async");
const { app, BrowserWindow } = require('electron')

let settings = null;

function createWindow () {
	const win = new BrowserWindow({
		width: 550,
		height: 410,
		icon: "resources/icon.ico",
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	})
	win.setMenu(null);
	win.resizable = false;
	win.loadFile('settings.html');
	
	async.series([
		function(callback) {
			loadSettings(callback);
		}, function(callback) {
			console.log(JSON.stringify(settings));
			callback(null, "two");
		}], 
	);
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