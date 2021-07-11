const ipcRenderer = require('electron').ipcRenderer;

const language_1_input = document.getElementById('language_1');
const language_2_input = document.getElementById('language_2');
const translation_key_input = document.getElementById('translation_key');
const automatic_timer_input = document.getElementById('timer_interval');
const scroll_translate_input = document.getElementById('scroll_translate');
const timer_translate_input = document.getElementById('timer_translate');
const submit_button = document.getElementById('submit');

//Sets initial settings on the html page upon startup
ipcRenderer.on("initial_settings", function(event, arg) {
	language_1_input.value = arg.language_1;
	language_2_input.value = arg.language_2;
	translation_key_input.value = arg.translation_key;
	automatic_timer_input.value = arg.timer_interval;
	scroll_translate_input.checked = arg.scroll_translate;
	timer_translate_input.checked = arg.timer_translate;
});

//Sends events to main process when settings are changed
language_1_input.addEventListener('input', () => {
	ipcRenderer.send('language_1_selected', language_1_input.value)
})

language_2_input.addEventListener('input', () => {
	ipcRenderer.send('language_2_selected', language_2_input.value)
})

translation_key_input.addEventListener('input', () => {
	ipcRenderer.send('translation_key_selected', translation_key.value)
})

automatic_timer_input.addEventListener('input', () => {
	let validated_timer_value = automatic_timer_input.value;
	if(validated_timer_value < 5){
		validated_timer_value = 5;
		automatic_timer_input.value = 5;
	} else if (validated_timer_value > 9999) {
		validated_timer_value = 9999;
		automatic_timer_input.value = 9999;
	}
	
	ipcRenderer.send('timer_interval_selected', validated_timer_value)
})

scroll_translate_input.addEventListener('input', () => {
	ipcRenderer.send('scroll_translate_input_changed', scroll_translate_input.checked);
})

timer_translate_input.addEventListener('input', () => {
	ipcRenderer.send('time_translate_input_changed', timer_translate_input.checked);
})

submit_button.addEventListener('click', () => {
	ipcRenderer.send('settings_submitted', "test");
})