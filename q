[1mdiff --git a/src/pages/index.astro b/src/pages/index.astro[m
[1mindex a7d391b..2736a82 100644[m
[1m--- a/src/pages/index.astro[m
[1m+++ b/src/pages/index.astro[m
[36m@@ -33,7 +33,7 @@[m [mconst latestNotes = allNotes.sort(collectionDateSort).slice(0, MAX_NOTES);[m
 		<!-- <p class="mb-4">这里主要是记录生活,会探索如何做生意,毕竟自己不是顶级打工人,靠着公司不是长久之计。</p> -->[m
 		<blockquote>- 2025-08-03</blockquote>[m
 [m
[31m-		<h6 class="title mb-6 mt-6">The way I roll:</h6>[m
[32m+[m		[32m<p class="mt-6"><strong>The way I roll:</strong></p>[m
 		<ul class="list-inside list-disc" role="list">[m
 			<li>If it’s not my business, let them.</li>[m
 		</ul>[m
