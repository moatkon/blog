import fs from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import satori, { type SatoriOptions } from "satori";
import { html } from "satori-html";
import RobotoMonoBold from "@/assets/roboto-mono-700.ttf";
import RobotoMono from "@/assets/roboto-mono-regular.ttf";
import { siteConfig } from "@/site.config";

// Roboto Mono has no CJK glyphs. Use a system CJK font when the build machine has one
// so Chinese titles are not silently dropped from the generated OG images.
const cjkFontPath = [
	"/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
	"/Library/Fonts/Arial Unicode.ttf",
	"/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttf",
	"/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.otf",
].find((fontPath) => fs.existsSync(fontPath));

const fonts: SatoriOptions["fonts"] = [
	{
		data: Buffer.from(RobotoMono),
		name: "Roboto Mono",
		style: "normal",
		weight: 400,
	},
	{
		data: Buffer.from(RobotoMonoBold),
		name: "Roboto Mono",
		style: "normal",
		weight: 700,
	},
];
if (cjkFontPath) {
	fonts.push({
		data: fs.readFileSync(cjkFontPath),
		name: "CJK Fallback",
		style: "normal",
		weight: 400,
	});
}

const ogOptions: SatoriOptions = {
	fonts,
	height: 630,
	width: 1200,
};

const markup = (title: string, eyebrow: string) =>
	html`<div tw="flex flex-col w-full h-full bg-[#0b1f26] text-[#c9cacc]">
		<div tw="flex flex-col flex-1 w-full p-12 justify-center">
			<p tw="text-2xl mb-6 text-[#7dd3e0]">${eyebrow}</p>
			<h1 tw="text-6xl font-bold leading-snug text-white">${title}</h1>
		</div>
		<div tw="flex items-center justify-between w-full p-10 border-t-2 border-[#00769b] text-xl">
			<div tw="flex items-center">
				<div tw="flex items-center justify-center w-14 h-14 rounded-full bg-[#00769b] text-3xl font-bold text-white">
					M
				</div>
				<p tw="ml-4 font-semibold text-white">${siteConfig.title}</p>
			</div>
			<p>by ${siteConfig.author}</p>
		</div>
	</div>`;

export async function renderOgImage(title: string, eyebrow: string): Promise<Response> {
	const svg = await satori(markup(title, eyebrow), ogOptions);
	const png = new Uint8Array(new Resvg(svg).render().asPng());
	return new Response(png, {
		headers: {
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Type": "image/png",
		},
	});
}
