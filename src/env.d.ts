declare module "@pagefind/default-ui" {
	declare class PagefindUI {
		constructor(arg: unknown);
	}
}

declare module "markdown-it" {
	export default class MarkdownIt {
		constructor(options?: {
			html?: boolean;
			linkify?: boolean;
			typographer?: boolean;
		});
		render(src: string, env?: Record<string, unknown>): string;
	}
}
