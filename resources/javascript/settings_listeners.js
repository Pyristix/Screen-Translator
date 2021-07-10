const ipc = require('electron').ipcRenderer;

const language_1_input = document.getElementById('language_1');
const language_2_input = document.getElementById('language_2');
const translation_key_input = document.getElementById('translation_key');
const automatic_timer_input = document.getElementById('timer_interval');
const scroll_translate_input = document.getElementById('scroll_translate');
const timer_translate_input = document.getElementById('timer_translate');
const submit_button = document.getElementById('submit');


language_1_input.addEventListener('input', () => {
	ipc.send('language_1_selected', language_1_input.value)
})

language_2_input.addEventListener('input', () => {
	ipc.send('language_2_selected', language_2_input.value)
})

translation_key_input.addEventListener('input', () => {
	ipc.send('translation_key_selected', translation_key.value)
})

automatic_timer_input.addEventListener('input', () => {
	ipc.send('timer_interval_selected', automatic_timer_input.value)
})

scroll_translate_input.addEventListener('input', () => {
	ipc.send('scroll_translate_input_changed', scroll_translate_input.checked);
})

timer_translate_input.addEventListener('input', () => {
	ipc.send('time_translate_input_changed', timer_translate_input.checked);
})

submit_button.addEventListener('click', () => {
	ipc.send('settings_submitted', "test");
})