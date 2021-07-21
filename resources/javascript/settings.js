const ipcRenderer = require("electron").ipcRenderer;
const language_1_input = document.getElementById("language_1");
const language_2_input = document.getElementById("language_2");
const translation_key_input = document.getElementById("translation_key");
const scale_factor_input = document.getElementById("scale_factor");
const automatic_timer_input = document.getElementById("timer_interval");
const timer_translate_input = document.getElementById("timer_translate");
const submit_button = document.getElementById("submit");

const accepted_key_inputs = [16, 17, 18, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123];
let tki_pressed_keys = [];
let displayed_translation_key = "";

//Converts a character code into its corresponding string
function CharCode_to_string(code) {
	if (code === 16)
		return "Shift";
	else if (code === 17)
		return "Ctrl";
	else if (code === 18) 
		return "Alt";
	else if (code >= 112 && code <= 123) 
		return "F" + (code - 111).toString();
	else
		return String.fromCharCode(code);
}

//Converts a string representing a key into its corresponding character code
function string_to_CharCode(str) {
	if (str === "Shift")
		return 16;
	else if (str === "Ctrl")
		return 17;
	else if (str === "Alt") 
		return 18;
	else if (["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"].includes(str))
		return parseInt(str.slice(1)) + 111;
	else
		return str.charCodeAt(0);
}

//Checks if a translation key combination contains a key that isn't Ctrl, Shift, or Alt
function contains_nonmodifier_key (translation_key_str) {
	let key_array = displayed_translation_key.split("+").filter(word => word != "Shift" && word != "Ctrl" && word != "Alt");
	return key_array.length > 0;
}

//Sets initial settings on the html page upon startup
ipcRenderer.on("initial_settings", function(event, arg) {
	language_1_input.value = arg.language_1;
	language_2_input.value = arg.language_2;
	translation_key_input.value = arg.translation_key;
	scale_factor_input.value = arg.scale_factor;
	automatic_timer_input.value = arg.timer_interval;
	timer_translate_input.checked = arg.timer_translate_enabled;
});

//Listener for debugging
ipcRenderer.on("console_log", function(event, arg) {
	console.log(arg);
})


//
//	Sends events to main process when settings are changed
//

language_1_input.addEventListener("input", () => {
	ipcRenderer.send("language_1_selected", language_1_input.value)
})

language_2_input.addEventListener("input", () => {
	ipcRenderer.send("language_2_selected", language_2_input.value)
})

//Prevents doubling up of translation key input on-screen
translation_key_input.addEventListener("input", () => {
	if (translation_key_input.value !== displayed_translation_key)
		translation_key_input.value = displayed_translation_key;
})

translation_key_input.addEventListener("keydown", (event) => {
	if (tki_pressed_keys.length < 3 && !(tki_pressed_keys.includes(event.keyCode)) && accepted_key_inputs.includes(event.keyCode)) {
		tki_pressed_keys.push(event.keyCode);
	}
	
	displayed_translation_key = "";
	
	for (let i = 0; i < tki_pressed_keys.length; i++) {
		if (i === tki_pressed_keys.length - 1){
			displayed_translation_key += CharCode_to_string(tki_pressed_keys[i]);
		}
		else{
			displayed_translation_key += CharCode_to_string(tki_pressed_keys[i]) + "+";
		}
	}
	//Makes sure there are more than just some combination than Ctrl, Alt, and Shift
	if (!(contains_nonmodifier_key(displayed_translation_key)))
		displayed_translation_key = "";
	
	//This line changes the input value to displayed_transition_key in case the key combo isn't counted
	//as input by the input event handler. (i.e. when Ctrl or Alt are included in the key combo)
	translation_key_input.value = displayed_translation_key;
	ipcRenderer.send("translation_key_selected", displayed_translation_key)
})

translation_key_input.addEventListener("keyup", (event) => {
	let released_key_index = tki_pressed_keys.indexOf(event.keyCode);
	if (released_key_index !== -1)
		tki_pressed_keys.splice(released_key_index, 1);
})


automatic_timer_input.addEventListener("input", () => {
	let validated_timer_value = automatic_timer_input.value;
	if(validated_timer_value < 5){
		validated_timer_value = 5;
		automatic_timer_input.value = 5;
	} else if (validated_timer_value > 9999) {
		validated_timer_value = 9999;
		automatic_timer_input.value = 9999;
	}
	
	ipcRenderer.send("timer_interval_selected", validated_timer_value)
})

scale_factor_input.addEventListener("input", () => {
	let validated_scale_factor_value = scale_factor_input.value;
	if(validated_scale_factor_value < 0.1){
		validated_scale_factor_value = 0.1;
		scale_factor_input.value = 0.1;
	} else if (validated_scale_factor_value > 2) {
		validated_scale_factor_value = 2;
		scale_factor_input.value = 2;
	}
	
	ipcRenderer.send("scale_factor_selected", validated_scale_factor_value);
})

timer_translate_input.addEventListener("input", () => {
	ipcRenderer.send("timer_translate_input_changed", timer_translate_input.checked);
})

submit_button.addEventListener("click", () => {
	ipcRenderer.send("settings_submitted", "test");
})