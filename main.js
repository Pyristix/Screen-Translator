const async = require("async");
const https = require('https');
const fs = require("fs");
const path = require("path");
const screenshot = require("screenshot-desktop");
const vision = require("@google-cloud/vision");
const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");

let translation_window_array = [];
let settings = null;
let translate_timer = null;
let translations_up = false;
let scale_factor = 1280/1920;

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
			if(settings.translation_key_enabled && settings.translation_key !== "")
				globalShortcut.register(settings.translation_key, () => {translateScreen()});
			callback(null, "two");
		}]
	);
	
	win.on("close", function () {
		for (let i = 0; i < translation_window_array.length; i++)
			translation_window_array[i].close();
	})
	
	setIpcListeners();
}

async function translateScreen() {
	for (let i = 0; i < translation_window_array.length; i++)
		translation_window_array[i].close();
	translation_window_array = [];
	
	if(translations_up){
		translations_up = false;
		return;
	}
		
	await screenshot({filename: "./resources/screen.png"});
	
	let text_block_array = null;
	text_block_array = await googleVisionDetect();
	
	if(text_block_array.length === 0)
		return;
	
	console.log(text_block_array[0].text)
	
	for (let i = 0; i < text_block_array.length; i++){
		console.log(text_block_array[i].text + ": " + JSON.stringify(text_block_array[i].boundingBox))
		let x = Math.round(Math.min(text_block_array[i].boundingBox[0].x, text_block_array[i].boundingBox[1].x, text_block_array[i].boundingBox[2].x, text_block_array[i].boundingBox[3].x)*scale_factor);
		let y = Math.round(Math.min(text_block_array[i].boundingBox[0].y, text_block_array[i].boundingBox[1].y, text_block_array[i].boundingBox[2].y, text_block_array[i].boundingBox[3].y)*scale_factor);
		let width = Math.round((Math.max(text_block_array[i].boundingBox[0].x, text_block_array[i].boundingBox[1].x, text_block_array[i].boundingBox[2].x, text_block_array[i].boundingBox[3].x)*scale_factor - x));
		let height = Math.round((Math.max(text_block_array[i].boundingBox[0].y, text_block_array[i].boundingBox[1].y, text_block_array[i].boundingBox[2].y, text_block_array[i].boundingBox[3].y)*scale_factor - y));
		console.log("1. " + x)
		console.log("2. " + y)
		console.log("3. " + width)
		console.log("4. " + height)
		translation_window_array.push(new BrowserWindow({
			x: x,
			y: y,
			width: width,
			height: height,
			frame: false,
			icon: "resources/images/icon.ico",
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false
			}
		}));
	}
	
	for (let i = 0; i < translation_window_array.length; i++){
		translation_window_array[i].loadFile("resources/html/translation_box.html");
		translation_window_array[i].setAlwaysOnTop(true);
		translation_window_array[i].webContents.on("did-finish-load", () => {
			translation_window_array[i].webContents.send("send_translation", getDeepLTranslation(text_block_array[i].text));
		});
	}
	
	translations_up = true;
}

//Returns an array of objects containing blocks of text in the desired language and their bounding boxes
async function googleVisionDetect() {
	const detected_text_array = await client.textDetection('./resources/screen.png');
	let adjusted_text_array = [];
	
	try{
		for (let page in detected_text_array[0].fullTextAnnotation.pages) {
			for (let block in detected_text_array[0].fullTextAnnotation.pages[page].blocks){
				let block_text = "";
				for (let paragraph in detected_text_array[0].fullTextAnnotation.pages[page].blocks[block].paragraphs){
					for (let word in detected_text_array[0].fullTextAnnotation.pages[page].blocks[block].paragraphs[paragraph].words){
						for (let symbol in detected_text_array[0].fullTextAnnotation.pages[page].blocks[block].paragraphs[paragraph].words[word].symbols){
							block_text += detected_text_array[0].fullTextAnnotation.pages[page].blocks[block].paragraphs[paragraph].words[word].symbols[symbol].text;
						}
					}
				}
				//Only takes the concatenated text from each block and its bounding box info
				adjusted_text_array.push({
					"text": block_text,
					"boundingBox": detected_text_array[0].fullTextAnnotation.pages[page].blocks[block].boundingBox.vertices
				});
			}
		}
	} catch (error) {
		console.log("Google Vision results processing error:\n" + error);
		return;
	}

	if(adjusted_text_array.length > 0)
		return languageFilterText(adjusted_text_array);
	
	return adjusted_text_array;
}

//Filters out blocks of text that don't contain instances of language_1
function languageFilterText(adjusted_text_array) {
	let accepted_regex = null;
	let language_filtered_array = [];
	
	if (settings.language_1 === "JA")
		accepted_regex = new RegExp("[一-龠]|[ぁ-ゔ]|[ァ-ヴー]|[々〆〤]");
	else 
		accepted_regex = new RegExp("[a-zA-Z]");
	
	for (let i = 0; i < adjusted_text_array.length; i++)
		if(accepted_regex.test(adjusted_text_array[i].text))
			language_filtered_array.push(adjusted_text_array[i]);
		
	return language_filtered_array;
}

function getDeepLTranslation(text_to_translate) {
	let translation = "Test";
	
	https.get('https://api-free.deepl.com/v2/translate?auth_key=e5a36703-2001-1b8b-968c-a981fdca7036:fx&text=' + text_to_translate + "&target_lang=" + settings.language_2, (resp) => {
		let data = '';
		resp.on('data', (chunk) => {data += chunk;});
		// The whole response has been received. Print out the result.
		resp.on('end', () => {
			console.log(JSON.parse(data).translations[0].text);
			translation = JSON.parse(data).translations[0].text;
			console.log("Testing: " + translation)
		});
	}).on("error", (err) => {console.log("Error: " + err.message);});
	
	return translation;
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
		 timer_translate_enabled: true, 
		 translation_key_enabled: false}), 
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
		if(settings.translation_key_enabled && settings.translation_key !== "")
			globalShortcut.unregister(settings.translation_key);
		settings.translation_key = arg;
		if(settings.translation_key_enabled && settings.translation_key !== "")
			globalShortcut.register(settings.translation_key, () => {translateScreen()});
	});
	
	ipcMain.on("timer_interval_selected", function(event, arg) {
		console.log(arg);
		settings.timer_interval = arg;
		if(settings.timer_translate_enabled){
			clearInterval(translate_timer);
			translate_timer = setInterval(translateScreen, arg*1000);
		}
	});
	
	ipcMain.on("timer_translate_input_changed", function(event, arg) {
		console.log(arg);
		settings.timer_translate_enabled = arg;
		clearInterval(translate_timer);
		if(settings.timer_translate_enabled)
			translate_timer = setInterval(translateScreen, settings.timer_interval*1000);
	});
	
	ipcMain.on("enable_translation_key_input_changed", function(event, arg) {
		console.log(arg);
		settings.translation_key_enabled = arg;
		if(settings.translation_key_enabled)
			globalShortcut.register(settings.translation_key, () => {translateScreen()});
		else
			globalShortcut.unregister(settings.translation_key);
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
	process.env.GOOGLE_APPLICATION_CREDENTIALS = "./resources/screen-translator-319920-990533b3822e.json";
})

let client = new vision.ImageAnnotatorClient();

//Closes window when all windows are closed
app.on("window-all-closed", function() {
	if (process.platform !== "darwin") 
		app.quit();
})