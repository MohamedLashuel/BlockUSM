import $ from "jquery"
import * as lib from "../lib"

async function currentTabID(): Promise<number> {
	return (await browser.tabs.query({active: true})).map(tb => tb.id)[0] ?? 0;
}

function openPage(page: string){
	browser.tabs.create({ url: page });
}

function openExtensionPage(page: string | undefined){
	openPage(lib.extensionPageLink(page ?? "404"));
}

async function onReady() {
	$(".extlink").on("click", (event) => {
		openExtensionPage($(event.target).attr("id"));
		window.close();
	})
	$("#element-picker").on("click", async (_event) => {
		browser.tabs.sendMessage(await currentTabID(), "activate_picker");
		window.close();
	})
	$("#feedback").on("click", (event) => {
		openPage("https://forms.gle/NRRNnTrZcG6UN4Ns6")
		window.close();
	});
}

$(document).ready(onReady)
