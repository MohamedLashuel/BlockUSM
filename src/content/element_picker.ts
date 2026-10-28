import $ from "jquery";
import { finder, className } from "@medv/finder";
import * as lib from "../lib";

let g_preview: boolean = false;
let g_running: boolean = false;
const SHADOW_CLASS = "my-picker-widget-with-name-nobody-will-conflict-with-lobster";
// Find an element in the shadow root
const jqShadow = () => $(`.${SHADOW_CLASS}`);
const $sh = (s: string) => $(s, jqShadow()[0].shadowRoot as any)

const widget_html: string = `
<link rel="stylesheet" href=${browser.runtime.getURL("public/style.css")} type="text/css">
<div class="picker-widget">
	<label for="chosen_selector">Element selector (CSS selector)</label>
	<input type="text" id="chosen_selector"></textarea><br>
	<label for="site_pattern">Site to remove from</label>
	<input type="text" id="site_pattern"></input><br>
	<label for="name">Name of selector</label>
	<input type="text" id="name"></input><br>
	<select id="set_select"></select>
	<button type="button" id="add_button">Add to set</button><br>
	<input type="checkbox" id="preview_button"></input>
	<label for="preview_button">Toggle preview</label>
	<button type="button" id="close_button">Quit</input>
</div>`

let g_old_target: EventTarget | null = null;

const targetPartOfWidget = (et: EventTarget) => $(et).attr("class")?.includes(SHADOW_CLASS)

// Highlight the moused-over element
function handleMouseOver(event: Event){
	event.preventDefault();
	event.stopPropagation();
	if(event.target === null || targetPartOfWidget(event.target)) return
	
	// Remove the old element's highlight (if it changed)
	if(g_old_target !== null && g_old_target !== event.target) 
		$(g_old_target).removeClass("element-picker-hover");

	$(event.target).addClass("element-picker-hover");
	g_old_target = event.target;
}

function handleClick(event: Event){
	// Don't mess with the click event for widget buttons
	if(event.target === null || targetPartOfWidget(event.target)) return

	event.preventDefault();
	event.stopPropagation();
	
	// Get CSS selector for clicked element
	const selector: string = finder(event.target as Element, {
		className: n => className(n) && n !== "element-picker-hover"
	})

	// Unhide elements if they are hidden by preview
	if(g_preview) togglePreview();
	
	$sh("#chosen_selector").val(selector);
}

const handlers = {
	mouseover: handleMouseOver,
	click: handleClick
}

function createShadowDOM(): ShadowRoot {
	// Create the shadow DOM
	const shadow_host = document.createElement("div");
	$(shadow_host).addClass(SHADOW_CLASS).appendTo("body");
	return shadow_host.attachShadow({mode: "open"});
}

function createWidget(){
	$(createShadowDOM()).append($(widget_html));
	$sh("#add_button").on("click", submitElementSelector)
	$sh("#preview_button").on("click", togglePreview)
	$sh("#close_button").on("click", teardown);
}

// Duplicate code from block options. Refactor eventually
async function updateSetSelector(select_last: boolean = false){
	const num_of_sets: number = await lib.numberOfSets();
	const names: string[] = lib.u.range(num_of_sets).map(i => `Block set ${i+1}`);
	const selector: JQuery = $sh("#set_select");
	selector.empty();
	const options: JQuery[] = names.map(name => $("<option></option>").attr("value", name).text(name))
	if(select_last) options[options.length - 1].attr("selected", "true");
	options.forEach((opt) => selector.append(opt));
}
function setSelectedIndex(): number {
	const selected_str: string = $sh("#set_select").val() as string;
	const ind: number | null = lib.u.numberAtEnd(selected_str);
	return (ind ?? 1) - 1;
}

async function submitElementSelector(){
	const { block_sets: sets } = await lib.requestCachedStorage();
	const ind: number = setSelectedIndex();

	const name = $sh("#name").val() as string;
	const sel = $sh("#chosen_selector").val() as string;
	const pat = $sh("#site_pattern").val() as string;

	$sh("#name").val(""); $sh("#chosen_selector").val(""); $sh("#pat").val("");

	sets[ind].remove_selectors.push( { name, sel, pat } );
	lib.setStorage( {block_sets: sets} );
	alert("Added to set");
}

function togglePreview(){
	const sel: string = $sh("#chosen_selector").val() as string;
	const jq = $(sel);
	!g_preview ? jq.addClass("picker-hide") : $(".picker-hide").removeClass("picker-hide");
	g_preview = !g_preview;
	$sh("#preview_button").prop("checked", g_preview);
}

function setupWidget(){
	updateSetSelector();
	$sh("#site_pattern").val(window.location.href);
}

function setup(){
	if(g_running) return;
	createWidget();
	setupWidget();
	Object.entries(handlers).map(x => document.addEventListener(x[0], x[1], true));
	g_running = true;
}

function teardown(){
	if(g_preview) togglePreview();
	Object.entries(handlers).map(x => document.removeEventListener(x[0], x[1], true));
	jqShadow().remove();
	g_running = false;
	// Get rid of the red box
	if(g_old_target !== null) $(g_old_target).removeClass("element-picker-hover");
}

function handleMessage(msg: unknown){
	msg = msg as string;
	if(msg === "activate_picker") setup();
}

function handleKeyDown(evt: KeyboardEvent){
	const key = evt.key.toLowerCase();
	if(key === "p" && evt.ctrlKey && evt.altKey && !g_running) setup();
}
browser.runtime.onMessage.addListener(handleMessage)
document.addEventListener("keydown", handleKeyDown)