const ipcRenderer = require("electron").ipcRenderer;
const translation_display = document.getElementById("translation");

ipcRenderer.on("send_translation", function(event, arg) {
	translation_display.innerText = arg;
});