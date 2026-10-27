// Represent CSS as a JS object
export type CSSFields = {key: string, value: string}[]
// First string is the class to apply fields to
export type CSSObject = [string, CSSFields][]

export const STYLE_CLASS = "style-class-that-will-always-be-unique-hippopotamus";

// Insert CSS into the DOM
export function injectCSS(head: HTMLHeadElement, css: string){
	const style = document.createElement('style');
	style.textContent = css;
	style.classList.add(STYLE_CLASS)
	head.appendChild(style);
}

export function injectSpec(spec: CSSObject){
	const txt: string = makeCSSText(spec)
	injectCSS(document.head, txt);
}

export function cssFieldText(fields: CSSFields): string {
	return fields.map(x => `${x.key}: ${x.value};`).join("\n");
}

// Convert a CSSObject to valid CSS text
export function makeCSSText(spec: CSSObject): string {
	return spec.map(x => `${x[0]} { ${cssFieldText(x[1])} }`).join("\n");
}

// Convert raw input of text block to string array separated by newline
export function formatTextBlock(block: string): string[]{
	// Text blocks submitted as a form will be separated by \r\n, those that haven't are separated by \n
	// Check which separator is used and split by it
	const sep = block.includes("\r\n") ? "\r\n" : "\n";
	return block.split(sep).filter(v => v !== "");
}

export function serializeFormAsObject(form: JQuery): Record<string, string> {
	const obj: Record<string, string> = {};
	form.serializeArray().forEach(pair => obj[pair.name] = pair.value);
	return obj
}