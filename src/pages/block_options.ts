import $ from "jquery";
import 'jquery-validation';
import '../jquery.are-you-sure';
import * as lib from "../lib";
import * as dl from "../domlib";

// Intermediary between the form object and block set
// When parameters have been parsed as text but not in the exact format needed by BlockSet
type formText = {
	to_block: string,   
	to_exempt: string,
	to_remove_names: string[],
	to_remove_sels: string[],
	to_remove_pats: string[],
	time_ranges: string,
	day_boxes: string[],
	override_box: string,
	time_limit: string
};
type FormTextStruct = Record<string, string | string[]>;

// Removals have a name, a CSS selector, and a site pattern
const remove_tags = ["name", "sel", "pat", "but"];

function formTextFromForm(jq_form: JQuery): formText {
	let obj: FormTextStruct = dl.serializeFormAsObject(jq_form);
	obj = lib.u.includeKeys(obj, ["override_box"], "off");
	obj = lib.u.nestKeys(obj, lib.days, "day_boxes");
	remove_tags.forEach(t => {
		obj = lib.u.nestValuesOfMatchingKeys(obj, new RegExp(`removal_${t}_`), `to_remove_${t}s`);
	})
	return obj as formText
}

function rangeInputValid(ranges: string): boolean {
	const match = ranges.replaceAll(" ", "").match(/^([0-9]{4}-[0-9]{4})(,([0-9]{4}-[0-9]{4}))*$/)
	return match !== null || ranges === ""
}

function formatRangesInput(ranges: string): lib.TimeRange[] {
	if (!rangeInputValid(ranges) || ranges === "") return []
	
	const stringToTime = (s: string): lib.Time => {
		return {hour: Number(s.substring(0, 2)), minute: Number(s.substring(2))}
	}
	const stringToRange = (s: string): lib.TimeRange => {
		const times: string[] | undefined = s.split("-")
		return {start: stringToTime(times[0]), end: stringToTime(times[1])}
	}
	
	return ranges.replaceAll(" ", "").split(",").map(stringToRange)
}

function timeRangeToString(range: lib.TimeRange): string {
	const timeToString = (time: lib.Time): string => {
		const format = (num: Number) => num.toString().padStart(2, "0")
		return `${format(time.hour)}${format(time.minute)}`
	}
	return `${timeToString(range.start)}-${timeToString(range.end)}`
}

function BlockSetFromFormText(f: formText): lib.BlockSet {
	return {
		block_patterns: dl.formatTextBlock(f.to_block),
		exempt_patterns: dl.formatTextBlock(f.to_exempt),
		remove_selectors: 
			lib.u.mapn((n, e, p) => ({name: n, sel: e, pat: p}), 
				f.to_remove_names, f.to_remove_sels, f.to_remove_pats),
		allowed_times: formatRangesInput(f.time_ranges),
		allowed_days: f.day_boxes,
		minute_limit: f.time_limit === "" ? 0 : Number(f.time_limit),
		allow_override: f.override_box === "on"
	}
}

function BlockSetToFormText(set: lib.BlockSet): formText {
	return {
		to_block: set.block_patterns.join("\n"),
		to_exempt: set.exempt_patterns.join("\n"),
		to_remove_names: set.remove_selectors.map(obj => obj["name"]),
		to_remove_sels: set.remove_selectors.map(obj => obj["sel"]),
		to_remove_pats: set.remove_selectors.map(obj => obj["pat"]),
		time_ranges: set.allowed_times.map(timeRangeToString).join(", "),
		day_boxes: set.allowed_days,
		time_limit: set.minute_limit.toString(),
		override_box: set.allow_override.toString()
	}
}

function prePopulateCheckboxes(form_text: formText){
	$(".daybox").each((i, el) => {
		const elem: JQuery = $(el);
		elem.prop("checked", form_text.day_boxes.includes(elem.attr("name") ?? "sentinel"))
	})
	
	$("#override_box").prop("checked", form_text.override_box === "true")
}

function prePopulateTextAreas(form_text: formText){
	$("textarea, input[type=text]").each((i, el) =>{
		if(el.id.match("remove_")) return
		let elem: JQuery = $(el)
		elem.val(form_text[el.id as keyof formText])
	})
}

function prePopulateRemoveSelectors(form_text: formText){
	const n: number = form_text.to_remove_names.length;
	lib.u.repeat(addSelector, Math.max(n - 1, 0));
	lib.u.range(n).forEach(i => {
		$(`#removal_name_${i+1}`).val(form_text.to_remove_names[i]);
		$(`#removal_sel_${i+1}`).val(form_text.to_remove_sels[i]);
		$(`#removal_pat_${i+1}`).val(form_text.to_remove_pats[i]);
	})
}

async function prePopulateFields(ind: number){
	const block_set = (await lib.requestCachedStorage()).block_sets[ind];
	const form_text: formText = BlockSetToFormText(block_set);

	prePopulateTextAreas(form_text);
	prePopulateRemoveSelectors(form_text);
	prePopulateCheckboxes(form_text);
}

async function saveForm(event: Event, ind: number){
	event.preventDefault();
	const form_text: formText = formTextFromForm($("form"));
	const block_set: lib.BlockSet = BlockSetFromFormText(form_text);
	const { block_sets } = await lib.requestCachedStorage();
	block_sets[ind] = block_set;
	lib.setStorage({ block_sets });
	// Form has been saved, no longer "dirty"
	$('form').trigger('reinitialize.areYouSure');
	alert("Settings saved.")
}

async function updateSetChooser(select_last: boolean = false){
	const num_of_sets: number = await lib.numberOfSets();
	const names: string[] = lib.u.range(num_of_sets).map(i => `Block set ${i+1}`);
	const selector: JQuery = $("#set_select");
	selector.empty();
	const options: JQuery[] = names.map(name => $("<option></option>").attr("value", name).text(name))
	if(select_last) options[options.length - 1].attr("selected", "true");
	options.forEach((opt) => selector.append(opt));
}

function setupValidation(){
	$.validator.addMethod("proper_time_ranges", rangeInputValid)
	$("form").validate({
		rules: {
			time_limit: "digits",
			time_ranges: "proper_time_ranges"
		},
		messages: {
			time_limit: "Must be a whole number greater than or equal to 0",
			time_ranges: "Ranges are invalid. Example: 0000-0800, 1600-2400"
		}
	});
}

function loadSet(ind: number){
	prePopulateFields(ind);
	$("#save_changes").off("click")
	$("#save_changes").on("click", (event: Event) => saveForm(event, ind))
}

function setSelectedIndex(): number {
	const selected_str: string = $("#set_select").val() as string;
	const ind: number | null = lib.u.numberAtEnd(selected_str);
	return (ind ?? 1) - 1;
}

const loadSelectedSet = () => {
	loadSet(setSelectedIndex());
}

async function addSet(){
	await lib.makeNewDefaultBlockSet();
	await updateSetChooser();
}

async function tryRemoveSet(){
	if(await lib.numberOfSets() <= 1) return
	await lib.removeBlockSet(setSelectedIndex());
	await updateSetChooser(true);
	loadSelectedSet();
}

function clickDeleteSelectorHandler(event: Event){
	if(event.target === null){
		console.log("ERROR: Could not delete selector, target was null")
		return
	}
	const name: string = $(event.target).attr("id") as string
	// If numberAtEnd is null (for some reason) remove nothing silently
	const n: number = lib.u.numberAtEnd(name) ?? 0;
	lib.u.str_c("#removal_", remove_tags, `_${n}`).forEach(s => $(s).remove());
}

function addSelector(){
	const nums: number[] = $(".removal_name_box")
		.map((_i, x) => $(x).attr("name") as string)
		.toArray()
		.map(lib.u.numberAtEnd)
		.filter(x => x !== null);
	const n: number = Math.max(...nums) + 1;
	const cloneAndRename = (jq: JQuery, nm: string) => jq.clone().attr("id", nm).attr("name", nm);
	const new_els = Object.fromEntries(
		remove_tags.map(s => [s, cloneAndRename($(`#removal_${s}_1`), `removal_${s}_${n}`).val("")])
	)
	new_els["but"].on("click", clickDeleteSelectorHandler);

	remove_tags.map(s => $(`.remove_grid`).append(new_els[s]));
}

function onReady(){
	loadSet(0);
	updateSetChooser();
	$("#set_select").on("change", loadSelectedSet);
	$("#add_set").on("click", addSet)
	$("#remove_set").on("click", tryRemoveSet)
	$("#add_selector").on("click", addSelector)
	setupValidation();
	$("form").areYouSure();
}

$(document).ready(onReady)
