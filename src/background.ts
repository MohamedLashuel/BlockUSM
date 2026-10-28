import * as lib from "./lib"

let g_site_queue: (string | undefined)[] = [];
// Using lib.setStorage from an extension page or content script updates the cache via message to SW
// But here, storage must be set manually, and the cache must be updated manually at the same time
// It would be an error for SW to message itself, so we can't use lib.setStorage
let g_storage_cache: lib.Storage | undefined = undefined;

async function setStorageAndUpdateCache(obj: Partial<lib.Storage>){
	browser.storage.local.set(obj);
	g_storage_cache = g_storage_cache === undefined ? 
		await getCachedStorage() :
		Object.assign(g_storage_cache, obj);
}

browser.runtime.onInstalled.addListener( () => initializeStorage() );
function initializeStorage(){
	setStorageAndUpdateCache({
		block_sets: [lib.defaultBlockSet],
		seconds_used: [0],
		activated_presets: [],
		last_updated_day: {day: 0, month: 0, year: 0},
		override: null,
		scrub_patterns: []
	});
}

async function getCachedStorage(): Promise<lib.Storage>{
	g_storage_cache ??= await lib.getStorage();
	return g_storage_cache;
}

function isExtensionPage(url: string | undefined): boolean {
	if(url === undefined) return false
	const ext_base: string = browser.runtime.getURL("");
	return (new RegExp(ext_base)).test(url);
}

// Site blocking
async function blockCheck(tab: browser.tabs.Tab){
	const url = tab.url;
	if(isExtensionPage(url)) return
	if(await lib.isBlocked(await getCachedStorage(), tab.url)){
		if(tab.id === undefined) return
		browser.tabs.update(tab.id, {url: lib.extensionPageLink("blocked")});
	}
}

const activeTabs = () => browser.tabs.query({active: true})

// Update the extension toolbar icon with text showing how many minutes left to access current site
async function updateBadge(){
	const active_tab: browser.tabs.Tab | undefined = (await activeTabs())[0];

	const badge_text: string = active_tab?.url === undefined ? 
	"" : 
	minutesToBadgeText(await lib.minutesLeft(await getCachedStorage(), active_tab.url));

	browser.action.setBadgeText({text: badge_text});
}

// If it's a new day, update it in storage and reset time limits
async function checkForNewDay(storage: lib.Storage){
	const today = lib.todayYMD();
	if(lib.u.objectsStringifiedEqual(storage.last_updated_day, today)) return
	const new_settings = {last_updated_day: today, seconds_used: Array(storage.block_sets.length).fill(0)} 
	setStorageAndUpdateCache(new_settings);
	handleMessage({name: "update_storage", value: new_settings})
}

// Record which site user is on every second
async function fastUpdate(){
	const active_tabs: browser.tabs.Tab[] = await activeTabs();
	g_site_queue = g_site_queue.concat(active_tabs.map(tab => tab.url))
}

// Eventually push all of those sites to update time limits
async function slowUpdate(){
	const seconds_used = lib.pushSiteQueue(await getCachedStorage(), g_site_queue);
	setStorageAndUpdateCache( { seconds_used })
	g_site_queue = [];
	(await browser.tabs.query({active: true})).map(blockCheck);
	updateBadge();
}

function minutesToBadgeText(minutes: number | undefined): string {
	if(minutes === undefined || minutes < 0.05) return "";
	const val: string = (minutes < 1 ? 1 : Math.round(minutes)).toString();
	return `${val}m`
}

async function handleTabUpdate(tab: browser.tabs.Tab, changeInfo: browser.tabs._OnUpdatedChangeInfo,
	tab_id: number){
	// Only update if the url changed
	if(!changeInfo.url) return;
	// To redo removals for SPA page navigation. Errors whenever a new page is loaded, so ignore
	// those errors. This should be fixed, but I'm not sure how
	browser.tabs.sendMessage(tab_id, "tab_updated").catch(() => {});
	checkForNewDay(await getCachedStorage());
	blockCheck(tab);
	updateBadge();
}

// Doesn't do anything, just for notes
type MessageMap = {
  update_storage: Partial<Storage>,
  storage_request: lib.Storage
}

async function handleMessage(msg: any): Promise<unknown> {
	switch(msg?.name){
		case "update_storage":
			g_storage_cache = Object.assign(g_storage_cache ?? {}, msg.value) as any as lib.Storage;
		case "storage_request":
			return getCachedStorage();
	}
}

// Update the badge and blocking when URL is updated
browser.tabs.onUpdated.addListener((tab_id, changeInfo, tab) => handleTabUpdate(tab, changeInfo, tab_id));
// Update the badge when the tab is switched
browser.tabs.onActivated.addListener(updateBadge);
browser.runtime.onMessage.addListener(handleMessage);
setInterval(fastUpdate, 1 * 1000);
setInterval(slowUpdate, 30 * 1000);