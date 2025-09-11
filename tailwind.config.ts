import type { Config } from "tailwindcss";

export default {
	plugins: [require("@tailwindcss/typography")],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					"DM Sans Variable",
					"DM Sans",
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI",
					"Noto Sans SC",
					"PingFang SC",
					"Hiragino Sans GB",
					"Microsoft YaHei",
					"Helvetica Neue",
					"Helvetica",
					"Arial",
					"sans-serif",
				],
				mono: [
					"ui-monospace",
					"SFMono-Regular",
					"Menlo",
					"Monaco",
					"Consolas",
					"Liberation Mono",
					"Courier New",
					"monospace",
				],
			},
			typography: () => ({
				DEFAULT: {
					css: {
						// 基础字体设置
						fontFamily: "inherit",
						fontSize: "1rem",
						lineHeight: "1.8",
						letterSpacing: "0.01em",
						// 中文字体优化
						"p, li, blockquote": {
							lineHeight: "1.8",
							fontWeight: "400",
						},
						// 标题优化
						"h1, h2, h3, h4, h5, h6": {
							fontWeight: "600",
							lineHeight: "1.4",
							letterSpacing: "-0.01em",
							marginTop: "2em",
							marginBottom: "1em",
						},
						a: {
							textUnderlineOffset: "3px",
							"&:hover": {
								"@media (hover: hover)": {
									textDecorationColor: "var(--color-link)",
									textDecorationThickness: "2px",
								},
							},
						},
						blockquote: {
							borderLeftWidth: "0",
							fontStyle: "normal",// 添加这行，使用普通字体
							fontWeight: "normal", // 添加这行，防止字体变粗
    						color: "inherit",     // 添加这行，使用继承的文字颜色
						    quotes: "none",        // 添加这行，去掉引号
							"&:before": {          // 添加这部分，确保没有前置引号
								content: "none",
							},
							"&:after": {           // 添加这部分，确保没有后置引号
								content: "none",
							},
						},
						code: {
							border: "1px dotted #666",
							borderRadius: "2px",
						},
						kbd: {
							"&:where([data-theme='dark'], [data-theme='dark'] *)": {
								background: "var(--color-global-text)",
							},
						},
						hr: {
							borderTopStyle: "dashed",
						},
						strong: {
							fontWeight: "700",
						},
						sup: {
							marginInlineStart: "calc(var(--spacing) * 0.5)",
							a: {
								"&:after": {
									content: "']'",
								},
								"&:before": {
									content: "'['",
								},
								"&:hover": {
									"@media (hover: hover)": {
										color: "var(--color-link)",
									},
								},
							},
						},
						/* Table */
						"tbody tr": {
							borderBottomWidth: "none",
						},
						tfoot: {
							borderTop: "1px dashed #666",
						},
						thead: {
							borderBottomWidth: "none",
						},
						"thead th": {
							borderBottom: "1px dashed #666",
							fontWeight: "700",
						},
						'th[align="center"], td[align="center"]': {
							"text-align": "center",
						},
						'th[align="right"], td[align="right"]': {
							"text-align": "right",
						},
						'th[align="left"], td[align="left"]': {
							"text-align": "left",
						},
						".expressive-code, .admonition, .github-card": {
							marginTop: "calc(var(--spacing)*4)",
							marginBottom: "calc(var(--spacing)*4)",
						},
					},
				},
				sm: {
					css: {
						code: {
							fontSize: "var(--text-sm)",
							fontWeight: "400",
						},
					},
				},
			}),
		},
	},
} satisfies Config;
