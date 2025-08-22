import { type CollectionEntry, getCollection } from "astro:content";

/** filter out draft posts based on the environment */
export async function getAllPosts(): Promise<CollectionEntry<"post">[]> {
	return await getCollection("post", ({ data }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
}

/** Get tag metadata by tag name */
export async function getTagMeta(tag: string): Promise<CollectionEntry<"tag"> | undefined> {
	const tagEntries = await getCollection("tag", (entry) => {
		return entry.id === tag;
	});
	return tagEntries[0];
}

/** groups posts by year (based on option siteConfig.sortPostsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 */
export function groupPostsByYear(posts: CollectionEntry<"post">[]) {
	return posts.reduce<Record<string, CollectionEntry<"post">[]>>((acc, post) => {
		const year = post.data.publishDate.getFullYear();
		if (!acc[year]) {
			acc[year] = [];
		}
		acc[year]?.push(post);
		return acc;
	}, {});
}

/** returns all tags created from posts (inc duplicate tags)
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getAllTags(posts: CollectionEntry<"post">[]) {
	return posts.flatMap((post) => [...post.data.tags]);
}

/** returns all unique tags created from posts
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTags(posts: CollectionEntry<"post">[]) {
	return [...new Set(getAllTags(posts))];
}

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTagsWithCount(posts: CollectionEntry<"post">[]): [string, number][] {
	return [
		...getAllTags(posts).reduce(
			(acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => b[1] - a[1]);
}

/** Calculate similarity score between two posts based on shared tags
 *  Returns a score between 0 and 1, where 1 means identical tags
 */
function calculateTagSimilarity(post1: CollectionEntry<"post">, post2: CollectionEntry<"post">): number {
	const tags1 = new Set(post1.data.tags);
	const tags2 = new Set(post2.data.tags);

	// If either post has no tags, return 0
	if (tags1.size === 0 || tags2.size === 0) {
		return 0;
	}

	// Calculate intersection and union
	const intersection = new Set([...tags1].filter(tag => tags2.has(tag)));
	const union = new Set([...tags1, ...tags2]);

	// Jaccard similarity coefficient
	return intersection.size / union.size;
}

/** Get related posts for a given post based on tag similarity
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getRelatedPosts(
	currentPost: CollectionEntry<"post">,
	allPosts: CollectionEntry<"post">[],
	maxResults: number = 3
): CollectionEntry<"post">[] {
	// Filter out the current post and posts without tags
	const candidatePosts = allPosts.filter(post =>
		post.id !== currentPost.id &&
		post.data.tags.length > 0
	);

	// If current post has no tags, return recent posts
	if (currentPost.data.tags.length === 0) {
		return candidatePosts
			.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
			.slice(0, maxResults);
	}

	// Calculate similarity scores and sort by similarity
	const postsWithSimilarity = candidatePosts
		.map(post => ({
			post,
			similarity: calculateTagSimilarity(currentPost, post)
		}))
		.filter(item => item.similarity > 0) // Only include posts with some similarity
		.sort((a, b) => {
			// Primary sort: by similarity score (descending)
			if (b.similarity !== a.similarity) {
				return b.similarity - a.similarity;
			}
			// Secondary sort: by publish date (descending) for posts with same similarity
			return b.post.data.publishDate.getTime() - a.post.data.publishDate.getTime();
		});

	// If no similar posts found, return recent posts
	if (postsWithSimilarity.length === 0) {
		return candidatePosts
			.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
			.slice(0, maxResults);
	}

	return postsWithSimilarity
		.slice(0, maxResults)
		.map(item => item.post);
}
