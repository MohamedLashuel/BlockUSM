type StringIndexed = { [index: string]: any}

function applyToObject<T extends object, U>(obj: T, ary: U[], fun: (arg0: T, arg1: U) => void): T {
	obj = { ... obj};
	ary.forEach((u: U) => fun(obj, u));
	return obj;
}

// If any keys are not present in the object, assign them with a default value
export function includeKeys<T extends Object>(obj: T, new_keys: (keyof T)[], default_val: T[keyof T]): T {
	return applyToObject({...obj}, new_keys, (o, k) => o[k] = o[k] ?? default_val)
}

// Round up all present specified keys, ignoring values, and stuff them in an array in a new key
export function nestKeys(obj: StringIndexed, keys: string[], new_key: string): StringIndexed {
	const [wth, wthout] = splitOutKeys(obj, keys);
	wthout[new_key] = Object.keys(wth);
	return wthout;
}

function matchingKeys(obj: StringIndexed, re: RegExp): string[] {
	return Object.keys(obj).filter(str => str.match(re));
}

export function nestValuesOfMatchingKeys(obj: StringIndexed, re: RegExp, new_key: string): StringIndexed {
	const value_ary = matchingKeys(obj, re).sort().map(s => obj[s]);
	const obj2: typeof obj = omitMatch(obj, re);
	obj2[new_key] = value_ary;
	return obj2;
}

// Take given keys from object
export function pick<T extends Object>(obj: T, props: (keyof T)[]): T {
  return applyToObject({} as T, props, (o, p) => {
  	// Only take keys which actually exist in the object
  	if(Object.hasOwn(obj, p)) o[p] = obj[p]
  });
}

// Omit given keys from object
export function omit<T extends Object>(obj: T, props: (keyof T)[]): T {
	return applyToObject({...obj}, props, (o, p) => delete o[p])
}

// Omit keys matching regex
export function omitMatch<T>(obj: Record<string, T>, re: RegExp): typeof obj {
	return omit(obj, matchingKeys(obj, re));
}

export const intersection = <T>(arr1: T[], arr2: T[]): T[] => arr1.filter(item => arr2.includes(item))

// Return obj with only and without given keys
export function splitOutKeys<T>(obj: Record<string, T>, keys: string[]): [typeof obj, typeof obj]{
	return [pick(obj, keys), omit(obj, keys)];
}
// [0, 1, ..., n - 1]
export const range = (n: number): number[] => [...Array(n).keys()]

export function popAt<T>(ary: T[], ind: number): T[] {
	const ary2: T[] = [...ary];
	ary2.splice(ind, 1);
	return ary2
}

// Extract matching regex pattern from string (if there is one)
export function reExtract(str: string, re: RegExp): string | undefined {
	const result: RegExpExecArray | null = re.exec(str);
	return (result === null ? undefined : result[0])
}

// Map along 2 or n arrays
export function map2<T1, T2, R>(ary1: T1[], ary2: T2[], fun: (arg0: T1, arg1: T2) => R): R[]{
	return range(ary1.length).map(i => fun(ary1[i], ary2[i]));
}

export function mapn<T, R>(fun: (...args: T[]) => R, ...arys: T[][]): R[]{
	return range(arys[0].length).map(i => {
		const itemsAtI: any[] = arys.map(a => a[i]);
		return fun(...itemsAtI);
	})
}

// Call a function n times and return the results
export function repeat<F extends (...args: any) => any>(fun: F, n: number, args: any[] = []): ReturnType<F>[]{
	return range(n).map(_ => fun(...args));
}

// Results of fun from all combinations on items from array 1 and array 2
export function combinations2<T1, T2>(ary1: T1[], ary2: T2[], fun: (arg0: T1, arg1: T2) => any){
	return ary1.flatMap(x1 => ary2.map(x2 => fun(x1, x2)));
}

// Concatenates string arguments. If array as argument, uses all combinations of strings
// str_c("a", ["1", "2"], "b") -> ["a1b", "a2b"]
export function str_c(...args: (string | string[])[]): string[] {
	const arys: string[][] = args.map(a => typeof a === "string" ? [a] : a);
	return arys.reduce((a1, a2): string[] => combinations2(a1, a2, (s1, s2) => s1.concat(s2)));
}

export function fuseArrays<T1, T2>(a1: T1[], a2: T2[]): [T1, T2][] {
	return range(a1.length).map(i => [ a1[i], a2[i] ]);
}

export function numberAtEnd(str: string): number | null {
	const num: number = Number(reExtract(str, /[0-9]+/));
	return Number.isNaN(num) ? null : num
}

export function arraySum(ary: number[]): number {
	return ary.reduce((a, b) => a + b, 0);
}

export function objectsStringifiedEqual<T extends Object>(obj1: T, obj2: T): boolean {
	return JSON.stringify(obj1) === JSON.stringify(obj2);
}