import { getAllPosts } from "@/data/post";
import { siteConfig } from "@/site.config";
import rss from "@astrojs/rss";
import { render } from "astro:content";

export const GET = async () => {
	const posts = await getAllPosts();

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		items: await Promise.all(posts.map(async (post) => {
			// Try to render the content to HTML
			let htmlContent = '';
			try {
				const result = await render(post);
				htmlContent = result?.code || post.body || '';
			} catch (error) {
				console.error(`Error rendering post ${post.id}:`, error);
				htmlContent = post.body || '';
			}
			
			return {
				title: post.data.title,
				description: post.data.description, // Keep original description
				pubDate: post.data.publishDate,
				link: `posts/${post.id}/`,
				content: htmlContent, // Full HTML content
			};
		})),
	});
};
