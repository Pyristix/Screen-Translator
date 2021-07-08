const path = require('path')
const { app, BrowserWindow } = require('electron')

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