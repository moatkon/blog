import { getCollection, render } from "astro:content";
import rss from "@astrojs/rss";
import { siteConfig } from "@/site.config";

export const GET = async () => {
	const notes = await getCollection("note");

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: await Promise.all(notes.map(async (note) => {
			// Try to render the content to HTML
			let htmlContent = '';
			try {
				const result = await render(note);
				htmlContent = result?.code || note.body || '';
			} catch (error) {
				console.error(`Error rendering note ${note.id}:`, error);
				htmlContent = note.body || '';
			}
			
			return {
				title: note.data.title,
				description: note.data.description || '', // Add description if available
				pubDate: note.data.publishDate,
				link: `notes/${note.id}/`,
				content: htmlContent, // Full HTML content
			};
		})),
	});
};
