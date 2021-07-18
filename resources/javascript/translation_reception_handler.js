const ipcRenderer = require("electron").ipcRenderer;
const translation_display = document.getElementById("translation");
ipcRenderer.on("send_translation", function(event, arg) {
	console.log(arg)
	translation_display.innerText = arg;
});