import { type CollectionEntry, getCollection, render } from "astro:content";

/** filter out draft posts based on the environment */
export async function getAllPosts(): Promise<CollectionEntry<"post">[]> {
	return await getCollection("post", ({ data }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
}

/** Get all notes (filter out drafts) */
export async function getAllNotes(): Promise<CollectionEntry<"note">[]> {
	return await getCollection("note", ({ data }) => {
		// Filter out drafts if the note has a draft field
		return import.meta.env.PROD ? !(data as any).draft : true;
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

/** Get adjacent posts (previous and next) for navigation
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 */
export function getAdjacentPosts(
	currentPost: CollectionEntry<"post">,
	allPosts: CollectionEntry<"post">[]
): { prevPost: CollectionEntry<"post"> | null; nextPost: CollectionEntry<"post"> | null } {
	// Sort posts by publish date (newest first)
	const sortedPosts = allPosts.sort((a, b) =>
		b.data.publishDate.getTime() - a.data.publishDate.getTime()
	);

	const currentIndex = sortedPosts.findIndex(post => post.id === currentPost.id);

	if (currentIndex === -1) {
		return { prevPost: null, nextPost: null };
	}

	// Previous post is newer (index - 1), next post is older (index + 1)
	const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
	const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

	return { prevPost, nextPost };
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

/** Statistics interfaces and types */
export interface BlogStats {
	totalPosts: number;
	totalWords: number;
	totalReadingTime: number; // in minutes
	averageWordsPerPost: number;
	averageReadingTimePerPost: number; // in minutes
	postsByYear: Record<string, number>;
	postsByMonth: Record<string, number>;
	tagStats: [string, number][];
	firstPostDate: Date | null;
	lastPostDate: Date | null;
	postsThisYear: number;
	postsThisMonth: number;
	longestPost: { title: string; words: number; id: string } | null;
	shortestPost: { title: string; words: number; id: string } | null;
	// Note statistics
	totalNotes: number;
	totalNotesWords: number;
	totalNotesReadingTime: number; // in minutes
	averageWordsPerNote: number;
	averageReadingTimePerNote: number; // in minutes
	notesByYear: Record<string, number>;
	notesByMonth: Record<string, number>;
	firstNoteDate: Date | null;
	lastNoteDate: Date | null;
	notesThisYear: number;
	notesThisMonth: number;
	longestNote: { title: string; words: number; id: string } | null;
	shortestNote: { title: string; words: number; id: string } | null;
}

export interface MonthlyStats {
	year: number;
	month: number;
	count: number;
	monthName: string;
}

/** Calculate comprehensive blog statistics */
export async function getBlogStats(): Promise<BlogStats> {
	// Get all posts but filter out drafts for statistics (regardless of environment)
	const allPosts = await getCollection("post");
	const posts = allPosts.filter(({ data }) => !data.draft);

	// Get all notes but filter out drafts for statistics (regardless of environment)
	const allNotes = await getCollection("note");
	const notes = allNotes.filter(({ data }) => !(data as any).draft);

	if (posts.length === 0 && notes.length === 0) {
		return {
			totalPosts: 0,
			totalWords: 0,
			totalReadingTime: 0,
			averageWordsPerPost: 0,
			averageReadingTimePerPost: 0,
			postsByYear: {},
			postsByMonth: {},
			tagStats: [],
			firstPostDate: null,
			lastPostDate: null,
			postsThisYear: 0,
			postsThisMonth: 0,
			longestPost: null,
			shortestPost: null,
			// Note statistics
			totalNotes: 0,
			totalNotesWords: 0,
			totalNotesReadingTime: 0,
			averageWordsPerNote: 0,
			averageReadingTimePerNote: 0,
			notesByYear: {},
			notesByMonth: {},
			firstNoteDate: null,
			lastNoteDate: null,
			notesThisYear: 0,
			notesThisMonth: 0,
			longestNote: null,
			shortestNote: null,
		};
	}

	// Calculate word counts and reading times for all posts - direct character counting
	const postsWithStats = await Promise.all(
		posts.map(async (post) => {
			// Get the raw markdown content (excluding frontmatter)
			const { body } = post;
			const content = body || '';

			// Remove markdown syntax and count actual characters
			const cleanContent = content
				.replace(/```[\s\S]*?```/g, '') // Remove code blocks
				.replace(/`[^`]*`/g, '') // Remove inline code
				.replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
				.replace(/\[.*?\]\(.*?\)/g, '') // Remove links
				.replace(/[#*_~`]/g, '') // Remove markdown formatting
				.replace(/\s+/g, ' ') // Normalize whitespace
				.trim();

			// Count actual characters (works well for Chinese content)
			const actualWords = cleanContent.length;
			// For reading time: assume 300 characters per minute for Chinese content
			const actualReadingMinutes = Math.max(Math.round(actualWords / 300), 1);

			return {
				post,
				words: actualWords,
				readingTime: actualReadingMinutes,
			};
		})
	);

	// Basic statistics
	const totalPosts = posts.length;
	const totalWords = postsWithStats.reduce((sum, { words }) => sum + words, 0);
	const totalReadingTime = postsWithStats.reduce((sum, { readingTime }) => sum + readingTime, 0);
	const averageWordsPerPost = totalWords / totalPosts;
	const averageReadingTimePerPost = totalReadingTime / totalPosts;

	// Date-based statistics
	const sortedPosts = posts.sort((a, b) => a.data.publishDate.getTime() - b.data.publishDate.getTime());
	const firstPostDate = sortedPosts[0]?.data.publishDate || null;
	const lastPostDate = sortedPosts[sortedPosts.length - 1]?.data.publishDate || null;

	// Current year and month statistics
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth();

	const postsThisYear = posts.filter(post => post.data.publishDate.getFullYear() === currentYear).length;
	const postsThisMonth = posts.filter(post => {
		const postDate = post.data.publishDate;
		return postDate.getFullYear() === currentYear && postDate.getMonth() === currentMonth;
	}).length;

	// Posts by year
	const postsByYear = posts.reduce<Record<string, number>>((acc, post) => {
		const year = post.data.publishDate.getFullYear().toString();
		acc[year] = (acc[year] || 0) + 1;
		return acc;
	}, {});

	// Posts by month (format: "YYYY-MM")
	const postsByMonth = posts.reduce<Record<string, number>>((acc, post) => {
		const date = post.data.publishDate;
		const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		acc[monthKey] = (acc[monthKey] || 0) + 1;
		return acc;
	}, {});

	// Tag statistics
	const tagStats = getUniqueTagsWithCount(posts);

	// Longest and shortest posts
	const sortedByWords = postsWithStats.sort((a, b) => b.words - a.words);
	const longestPost = sortedByWords[0] ? {
		title: sortedByWords[0].post.data.title,
		words: sortedByWords[0].words,
		id: sortedByWords[0].post.id,
	} : null;

	const shortestPostItem = sortedByWords[sortedByWords.length - 1];
	const shortestPost = shortestPostItem ? {
		title: shortestPostItem.post.data.title,
		words: shortestPostItem.words,
		id: shortestPostItem.post.id,
	} : null;

	// Calculate note statistics - direct character counting
	const notesWithStats = await Promise.all(
		notes.map(async (note) => {
			// Get the raw markdown content (excluding frontmatter)
			const { body } = note;
			const content = body || '';

			// Remove markdown syntax and count actual characters
			const cleanContent = content
				.replace(/```[\s\S]*?```/g, '') // Remove code blocks
				.replace(/`[^`]*`/g, '') // Remove inline code
				.replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
				.replace(/\[.*?\]\(.*?\)/g, '') // Remove links
				.replace(/[#*_~`]/g, '') // Remove markdown formatting
				.replace(/\s+/g, ' ') // Normalize whitespace
				.trim();

			// Count actual characters (works well for Chinese content)
			const actualWords = cleanContent.length;
			// For reading time: assume 300 characters per minute for Chinese content
			const actualReadingMinutes = Math.max(Math.round(actualWords / 300), 1);

			return {
				note,
				words: actualWords,
				readingTime: actualReadingMinutes,
			};
		})
	);

	// Note basic statistics
	const totalNotes = notes.length;
	const totalNotesWords = notesWithStats.reduce((sum, { words }) => sum + words, 0);
	const totalNotesReadingTime = notesWithStats.reduce((sum, { readingTime }) => sum + readingTime, 0);
	const averageWordsPerNote = totalNotes > 0 ? totalNotesWords / totalNotes : 0;
	const averageReadingTimePerNote = totalNotes > 0 ? totalNotesReadingTime / totalNotes : 0;

	// Note date-based statistics
	const sortedNotes = notes.sort((a, b) => a.data.publishDate.getTime() - b.data.publishDate.getTime());
	const firstNoteDate = sortedNotes[0]?.data.publishDate || null;
	const lastNoteDate = sortedNotes[sortedNotes.length - 1]?.data.publishDate || null;

	// Current year and month note statistics
	const notesThisYear = notes.filter(note => note.data.publishDate.getFullYear() === currentYear).length;
	const notesThisMonth = notes.filter(note => {
		const noteDate = note.data.publishDate;
		return noteDate.getFullYear() === currentYear && noteDate.getMonth() === currentMonth;
	}).length;

	// Notes by year
	const notesByYear = notes.reduce<Record<string, number>>((acc, note) => {
		const year = note.data.publishDate.getFullYear().toString();
		acc[year] = (acc[year] || 0) + 1;
		return acc;
	}, {});

	// Notes by month (format: "YYYY-MM")
	const notesByMonth = notes.reduce<Record<string, number>>((acc, note) => {
		const date = note.data.publishDate;
		const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		acc[monthKey] = (acc[monthKey] || 0) + 1;
		return acc;
	}, {});

	// Longest and shortest notes
	const sortedNotesByWords = notesWithStats.sort((a, b) => b.words - a.words);
	const longestNote = sortedNotesByWords[0] ? {
		title: sortedNotesByWords[0].note.data.title,
		words: sortedNotesByWords[0].words,
		id: sortedNotesByWords[0].note.id,
	} : null;

	const shortestNoteItem = sortedNotesByWords[sortedNotesByWords.length - 1];
	const shortestNote = shortestNoteItem ? {
		title: shortestNoteItem.note.data.title,
		words: shortestNoteItem.words,
		id: shortestNoteItem.note.id,
	} : null;

	return {
		totalPosts,
		totalWords,
		totalReadingTime,
		averageWordsPerPost: Math.round(averageWordsPerPost),
		averageReadingTimePerPost: Math.round(averageReadingTimePerPost * 10) / 10, // Round to 1 decimal
		postsByYear,
		postsByMonth,
		tagStats,
		firstPostDate,
		lastPostDate,
		postsThisYear,
		postsThisMonth,
		longestPost,
		shortestPost,
		// Note statistics
		totalNotes,
		totalNotesWords,
		totalNotesReadingTime,
		averageWordsPerNote: Math.round(averageWordsPerNote),
		averageReadingTimePerNote: Math.round(averageReadingTimePerNote * 10) / 10, // Round to 1 decimal
		notesByYear,
		notesByMonth,
		firstNoteDate,
		lastNoteDate,
		notesThisYear,
		notesThisMonth,
		longestNote,
		shortestNote,
	};
}

/** Get monthly statistics for chart display */
export async function getMonthlyStats(): Promise<MonthlyStats[]> {
	const posts = await getAllPosts();
	const monthlyData = new Map<string, { year: number; month: number; count: number }>();

	posts.forEach(post => {
		const date = post.data.publishDate;
		const year = date.getFullYear();
		const month = date.getMonth();
		const key = `${year}-${month}`;

		if (!monthlyData.has(key)) {
			monthlyData.set(key, { year, month, count: 0 });
		}
		monthlyData.get(key)!.count++;
	});

	const monthNames = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	];

	return Array.from(monthlyData.values())
		.sort((a, b) => a.year - b.year || a.month - b.month)
		.map(item => ({
			...item,
			monthName: monthNames[item.month] || 'Unknown',
		}));
}
