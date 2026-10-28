import * as lib from "../lib"
import * as dl from "../domlib"
import $ from "jquery"

const ENGINE_SELECTORS: Record<string, string[]> = {
	"google.com/search": ["div[data-snc]", "table", "div[lang]", "div[data-sm]"],
	"duckduckgo.com/?*q=*t=": ["article", 'li'],
	"duckduckgo.com/?*t=*q=": ["article", 'li']
};

function getEngineSelectorsForURL(url: string){
	const matches: string[][] = Object.entries(ENGINE_SELECTORS)
		.filter(x => lib.matchesPattern(url, x[0]))
		.map(x => x[1]);
	return (matches.length === 0) ? [] : matches[0];
}

function elementLinksToPattern(el: HTMLElement, patterns: string[]): boolean {
	const jq = $(el);
	const jqHasLink = (pat: string) => jq.has(`a[href*="${pat}"]`).length > 0;
	return patterns.map(pat => jqHasLink(pat)).some(v => v);
}

function scrubPage(scrub_patterns: string[], url: string){
	const result_selectors = getEngineSelectorsForURL(url);
	const results = $(result_selectors.join(","));
	const scrubbable = results.filter((_i, el) => elementLinksToPattern(el, scrub_patterns))
	scrubbable.hide();
}

function handleChanges(records: MutationRecord[], scrub_patterns: string[], url: string){
	const num_additions: number = lib.u.arraySum(records.map(r => r.addedNodes.length));
	if(num_additions > 0) scrubPage(scrub_patterns, url);
}

function isScrubbable(url: string): boolean {
	return getEngineSelectorsForURL(url).length > 0;
}

// Can't use await in top level, so just stick everything we want to run in a function
async function go(){
	const url: string = window.location.href;
	if(!isScrubbable(url)) return;
	const { scrub_patterns } = await lib.requestCachedStorage();
	scrubPage(scrub_patterns, url);

	const observer = new MutationObserver((r, o) => handleChanges(r, scrub_patterns, url));
	observer.observe(document, { subtree: true, childList: true});
}

go();