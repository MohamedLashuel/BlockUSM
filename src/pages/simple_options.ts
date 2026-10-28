import * as lib from "../lib";
import * as dl from "../domlib"
import * as ps from "../preset_selectors";
import $ from "jquery";
import "../jquery.are-you-sure";

function presetSiteSection(site: string, site_presets: ps.SitePresets): JQuery<HTMLElement> {
	const fieldset = $("<fieldset></fieldset>").addClass("preset_fieldset");
	const summary = $("<summary></summary>").text(site_presets.name);
	const details = $("<details></details>");
	const div = $("<div></div>");

	const presets: Record<string, ps.Preset> = site_presets.value;
	Object.entries(presets).forEach((kv: [string, ps.Preset]) => {
		const id: string = site.concat("%").concat(kv[0]);
		const input = $("<input></input>")
			.attr("type", "checkbox")
			.attr("id", id)
			.attr("name", id);
		const label = $("<label></label>").attr("for", id).text(kv[1].name).prepend(input);
		div.append(label);
	});
	details.append(summary).append(div);
	fieldset.prepend(details);
	return fieldset;
}

function createPresetBoxes(){
	const target = $("#presets");
	Object.entries(ps.table).forEach((kv: [string, ps.SitePresets]) => {
		target.append(presetSiteSection(kv[0], kv[1]));
	})
}

async function prepopulatePresetBoxes(){
	const { activated_presets } = await lib.requestCachedStorage();
	$(".preset_fieldset").find("input[type=checkbox]").each((_i, el) => {
		const elem: JQuery = $(el);
		elem.prop("checked", activated_presets.includes(elem.attr("name") ?? "sentinel"));
	});
}

async function prepopulateFields(){
	prepopulatePresetBoxes();
	const { scrub_patterns, block_sets } = await lib.getStorage();
	$("#scrub_sites").val(scrub_patterns.join("\n"));
	$("#block_sites").val(block_sets[0].block_patterns.join("\n"));
}

async function saveForm(event: Event){
	event.preventDefault();
	const checkboxes = dl.serializeFormAsObject($('input[type="checkbox"]'));
	lib.setStorage( {
		activated_presets: Object.keys(checkboxes), 
		scrub_patterns: dl.formatTextBlock($("#scrub_sites").val() as string) 
	});
	lib.setSimpleBlockSites(dl.formatTextBlock($("#block_sites").val() as string))
	// Form has been saved, no longer "dirty"
	$('form').trigger('reinitialize.areYouSure');
	alert("Settings saved.")
}

function onReady(){
	createPresetBoxes();
	prepopulateFields();
	$("#save_changes").on("click", saveForm);
	$("form").areYouSure();
}

$(document).ready(onReady)