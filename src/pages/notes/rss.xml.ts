import rss from "@astrojs/rss";
import MarkdownIt from "markdown-it";
import { getAllNotes } from "@/data/post";
import { siteConfig } from "@/site.config";

const parser = new MarkdownIt();

export const GET = async () => {
	const notes = (await getAllNotes()).sort(
		(a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
	);

	return rss({
		title: `${siteConfig.title} - Notes`,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		customData: `<language>${siteConfig.lang}</language>`,
		items: notes.map((note) => ({
			title: note.data.title,
			description: note.data.description || "",
			pubDate: note.data.publishDate,
			link: `notes/${note.id}/`,
			content: parser.render(note.body || ""),
		})),
	});
};
