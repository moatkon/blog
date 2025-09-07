import type { SiteConfig, GiscusConfig } from "@/types";
import type { AstroExpressiveCodeOptions } from "astro-expressive-code";

export const siteConfig: SiteConfig = {
	// Used as both a meta property (src/components/BaseHead.astro L:31 + L:49) & the generated satori png (src/pages/og-image/[slug].png.ts)
	author: "Moatkon",
	// Date.prototype.toLocaleDateString() parameters, found in src/utils/date.ts.
	date: {
		locale: "zh-CN",
		options: {
			day: "numeric",
			month: "short",
			year: "numeric",
		},
	},
	// Used as the default description meta property and webmanifest description
	description: "Moatkon's Blog",
	// HTML lang property, found in src/layouts/Base.astro L:18 & astro.config.ts L:48
	lang: "zh-CN",
	// Meta property, found in src/components/BaseHead.astro L:42
	ogLocale: "zh_CN",
	/*
		- Used to construct the meta title property found in src/components/BaseHead.astro L:11
		- The webmanifest name found in astro.config.ts L:42
		- The link value found in src/components/layout/Header.astro L:35
		- In the footer found in src/components/layout/Footer.astro L:12
	*/
	title: "Moatkon's Blog",
	// ! Please remember to replace the following site property with your own domain, used in astro.config.ts
	url: "https://blog.moatkon.com/",
};

// Used to generate links in both the Header & Footer.
export const menuLinks: { path: string; title: string }[] = [
  {
		path: "/",
		title: "Home",
	},
	{
		path: "/posts/",
		title: "Posts",
	},
	{
		path: "/notes/",
		title: "Timeline",
	},
	{
		path: "/tags/",
		title: "Tags",
	},
	// {
	// 	path: "/stats/",
	// 	title: "Stats",
	// },
	{
		path: "/about/",
		title: "About",
	},
];

// https://expressive-code.com/reference/configuration/
export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
	styleOverrides: {
		borderRadius: "4px",
		codeFontFamily:
			'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
		codeFontSize: "0.875rem",
		codeLineHeight: "1.7142857rem",
		codePaddingInline: "1rem",
		frames: {
			frameBoxShadowCssValue: "none",
		},
		uiLineHeight: "inherit",
	},
	themeCssSelector(theme, { styleVariants }) {
		// If one dark and one light theme are available
		// generate theme CSS selectors compatible with cactus-theme dark mode switch
		if (styleVariants.length >= 2) {
			const baseTheme = styleVariants[0]?.theme;
			const altTheme = styleVariants.find((v) => v.theme.type !== baseTheme?.type)?.theme;
			if (theme === baseTheme || theme === altTheme) return `[data-theme='${theme.type}']`;
		}
		// return default selector
		return `[data-theme="${theme.name}"]`;
	},
	// One dark, one light theme => https://expressive-code.com/guides/themes/#available-themes
	themes: ["dracula", "github-light"],
	useThemedScrollbars: false,
};

// Giscus 评论系统配置
// 使用前需要：
// 1. 在 GitHub 仓库中启用 Discussions
// 2. 安装 Giscus GitHub App: https://github.com/apps/giscus
// 3. 在 https://giscus.app/zh-CN 获取配置参数
export const giscusConfig: GiscusConfig = {
	// GitHub 仓库信息 (格式: "用户名/仓库名")
	repo: "moatkon/blog",
	// 仓库 ID (在 giscus.app 获取)
	repoId: "R_kgDOPcurMQ",
	// 讨论分类名称
	category: "Announcements",
	// 讨论分类 ID (在 giscus.app 获取)
	categoryId: "DIC_kwDOPcurMc4Cue14",
	// 页面 ↔️ discussion 映射关系
	mapping: "url",
	// 是否启用严格标题匹配
	strict: "0",
	// 是否启用反应
	reactionsEnabled: "1",
	// 是否发送讨论元数据
	emitMetadata: "0",
	// 输入框位置
	inputPosition: "bottom",
	// 主题 (会被 JavaScript 动态覆盖以同步博客主题)
	theme: "preferred_color_scheme",
	// 语言
	lang: "zh-CN",
	// 加载方式
	loading: "lazy"
};
