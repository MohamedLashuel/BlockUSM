import * as lib from "../lib"
import * as dl from "../domlib"
import $ from "jquery"

// CSS object which hides the passed in selectors
export function hideSelectorsSpec(selectors: string[]): dl.CSSObject {
	return selectors.map(sel => [sel, [{key: "display", value: "none !important"}]]);
}

// Get the CSS object to update site with
async function getSpec(site: string): Promise<dl.CSSObject> {
	return hideSelectorsSpec(await lib.removalSelectors(site));
}

async function removeElements(url: string){
	getSpec(url).then(dl.injectSpec);
}

async function refreshRemoval(url: string){
	// Replace the style in the added element
	getSpec(url).then(spec => {
		const txt = dl.makeCSSText(spec)
		$(`.${dl.STYLE_CLASS}`).text(txt)
	});
}

// Need to check for tab updated because in SPAs, content scripts are not reinjected on every URL change
function handleMessage(msg: any) {
	if(msg === "tab_updated") refreshRemoval(window.location.href);
}

removeElements(window.location.href);
browser.runtime.onMessage.addListener(handleMessage);