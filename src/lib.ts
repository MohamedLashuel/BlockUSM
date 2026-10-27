import browser from "webextension-polyfill";
import * as ps from "./preset_selectors"
const reEscape: (s: string) => string = require('regexp.escape');
import * as u from "./utils";
export * as u from "./utils"

// Time/date
export type Time = {hour: number, minute: number}
export type TimeRange = {start: Time, end: Time}
export type YMD = {year: number, month: number, day: number}

function overrideDate(override: string | null): Date | null{
	return (override === null) ? null : new Date(override)
}

function isTimeWithinRange(time: Time, range: TimeRange) {
	const timeIsBefore = (t1: Time, t2: Time) => {
		return (t1.hour < t2.hour) || ( (t1.hour === t2.hour) && (t1.minute <= t2.minute) );
	}

	return timeIsBefore(range.start, time) && timeIsBefore(time, range.end);
}

export const days: string[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
// Today's day of week string
const todayDow = (): string => days[new Date().getDate()]

// Can use * as wildcard, can end with < to not match anything after. ** is wildcard except for /
export function matchesPattern(str: string, pat: string): boolean{
	const regex = new RegExp(reEscape(pat)
		.replaceAll(reEscape("**"), "[^/]*")
		.replaceAll(reEscape("*"), ".*")
		.replaceAll(reEscape("<"), "$")
	);
	return regex.test(str);
}

// Element removal. Has name, CSS selector, and site pattern to remove
type Removal = {name: string, sel: string, pat: string}
export type BlockSet = {
	block_patterns: string[],
	exempt_patterns: string[],
	remove_selectors: Removal[],
	allowed_times: TimeRange[],
	allowed_days: string[],
	minute_limit: number,
	allow_override: boolean
}

export const defaultBlockSet: BlockSet = {
	block_patterns: [],
	exempt_patterns: [],
	remove_selectors: [],
	allowed_times: [],
	allowed_days: [],
	minute_limit: 0,
	allow_override: false
}

// Given the date the override expires, does it apply?
function overrideApplies(override_date: Date | null){
	if(override_date === null) return false;
	const now = new Date();
	return now.getTime() < override_date.getTime();
}

// Is the url matched by block_patterns (and not by exempt_patterns)?
function doesSetBlockingMatchURL(set: BlockSet, url: string | undefined): boolean{
	if(!url) return(false);
	const anyMatches = (lst: string[]) => lst.some(( p => matchesPattern(url, p) ));
	return anyMatches(set.block_patterns) && !anyMatches(set.exempt_patterns);
}

// Should a url be blocked by this set?
function doesSetBlock(set: BlockSet, url: string, seconds: number, override: string | null){
	const override_date = overrideDate(override);
	const now = new Date();
	const current_time = {hour: now.getHours(), minute: now.getMinutes()};
	
	// Check options besides patterns
	const opts_check = {
		time_ok: set.allowed_times.some(x => isTimeWithinRange(current_time, x)),
		day_ok: set.allowed_days.includes(todayDow()),
		limit_ok: seconds < set.minute_limit * 60
	}
	const opts_ok = Object.values(opts_check).some(v => v);
	const overriden = set.allow_override && overrideApplies(override_date);
	return doesSetBlockingMatchURL(set, url) && !opts_ok && !overriden;
}

// All CSS selectors to remove on url from a set
function setRemovalSelectors(set: BlockSet, url: string): string[] {
	return set.remove_selectors.filter(obj => matchesPattern(url, obj.pat)).map(obj => obj.sel);
}

// Storage
export type Storage = {
  block_sets: BlockSet[],
  override: string | null,
  seconds_used: number[],
  activated_presets: string[],
  last_updated_day: YMD,
  scrub_patterns: string[]
};

// Return all of storage. If we have it cached, use that, otherwise set the cache
export async function getStorage(): Promise<Storage> {
	return browser.storage.local.get() as Promise<Storage>;
}

// Update storage and cache if it is set
export async function setStorage(obj: Partial<Storage>) {
	browser.runtime.sendMessage(undefined, {name: "update_storage", value: obj});
	browser.storage.local.set(obj);
}

// Update block set 1's block patterns (used in simple options page)
export async function setSimpleBlockSites(sites: string[]){
	const { block_sets } = await getStorage();
	block_sets[0].block_patterns = sites;
	setStorage( {block_sets} )
}

export async function makeNewDefaultBlockSet() {
	const {block_sets, seconds_used} = await getStorage();
	setStorage({
		block_sets: block_sets.concat([defaultBlockSet]), 
		seconds_used: seconds_used.concat([0])
	})
}

export async function removeBlockSet(ind: number) {
	const {block_sets, seconds_used} = await getStorage();
	setStorage({
		block_sets: u.popAt(block_sets, ind), 
		seconds_used: u.popAt(seconds_used, ind)
	})
}

export const numberOfSets = async (): Promise<number> => (await getStorage()).block_sets.length;

export function todayYMD(): YMD {
	const now = new Date();
	return {year: now.getFullYear(), month: now.getMonth(), day: now.getDate()};
}

// Should this url be blocked?
export async function isBlocked(storage: Storage, url: string | undefined): Promise<boolean> {
	if(!url) return false;
	const {block_sets: sets, seconds_used, override} = storage;
	return u.range(sets.length).some(i => doesSetBlock(sets[i], url, seconds_used[i], override))
}

// All CSS selectors to be removed from a url
export async function removalSelectors(url: string | undefined): Promise<string[]> {
	if(!url) return [];
	const {block_sets, activated_presets} = await getStorage();
	// Selectors come from two sources: block sets and presets
	const set_selectors: string[] = block_sets.map(set => setRemovalSelectors(set, url)).flat();
	const preset_selectors: string[] = activated_presets.map(p => ps.getByID(p))
		.filter(pre => matchesPattern(url, pre.pat)).map(pre => pre.sel);
	return set_selectors.concat(preset_selectors)
}

export function extensionPageLink(page: string): string {
	return browser.runtime.getURL(`dist/pages/${page}.html`);
}

// Given a list of sites to add a second to, add a second to them all. Return the new seconds used
export function pushSiteQueue(storage: Storage, site_queue: (string | undefined)[]) {
	const {block_sets, seconds_used} = storage;
	// Take in a site and add a second to each matching set
	function addSecondForSite(site: string | undefined){
		if(site === undefined) return
		block_sets.forEach((set, i) => {
			if(doesSetBlockingMatchURL(set, site)) 
				seconds_used[i]++
		});
	}

	site_queue.forEach(addSecondForSite)
	return seconds_used;
}

// Number of minutes left on site's time limit, undefined if there's no time limit
// Used to set badge text
export async function minutesLeft(storage: Storage, site: string): Promise<number | undefined> {
	const {block_sets, seconds_used, override} = storage;
	// If there's no override, set this to neg infinity so it doesn't affect math.max
	// Otherwise convert time the override will run out into minutes left
	const override_date = overrideDate(override)
	const override_time_diff = (override_date?.getTime() ?? -Infinity) - (new Date()).getTime();
	const override_minutes_left = override_time_diff / 1000 / 60;

	const minutes_left_for_each: number[] = u.fuseArrays(block_sets, seconds_used)
		.filter(x => doesSetBlockingMatchURL(x[0], site))
		.map(x => {
			const set_limit = x[0].minute_limit - (x[1] / 60);
			return Math.max(set_limit, x[0].allow_override ? override_minutes_left : -Infinity);
		});

	const min: number = Math.min(...minutes_left_for_each);
	return min === Infinity ? undefined : min;
}

export async function requestCachedStorage(): Promise<Storage> {
	return (await browser.runtime.sendMessage(undefined, {name: "storage_request"})) as Storage
}
 
export async function startOverride(minutes: number){
	const now = new Date();
	setStorage( { override: new Date(now.getTime() + minutes * 60 * 1000).toString() } );
}