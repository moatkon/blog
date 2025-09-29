import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { h, isNodeDirective } from "../utils/remark";

const DIRECTIVE_NAME = "map";

export const remarkGoogleMaps: Plugin<[], Root> = () => (tree) => {
	visit(tree, (node, index, parent) => {
		if (!parent || index === undefined || !isNodeDirective(node)) return;

		// We only want a leaf directive named DIRECTIVE_NAME
		if (node.type !== "leafDirective" || node.name !== DIRECTIVE_NAME) return;

		const nodeAttributes = node.attributes || {};
		
		// Extract Google Maps URL from src attribute
		const src = nodeAttributes.src;
		const placeId = nodeAttributes.placeId || nodeAttributes.placeid;
		const width = nodeAttributes.width || "100%";
		const height = nodeAttributes.height || "450";
		const title = nodeAttributes.title || "Google Map";
		const zoom = nodeAttributes.zoom || "13";
		const maptype = nodeAttributes.maptype || "roadmap";
		const language = nodeAttributes.language || nodeAttributes.lang || "zh-CN";
		const timeout = nodeAttributes.timeout || "10";
		const fallbackMessage = nodeAttributes.fallbackMessage || nodeAttributes.fallback || "地图加载失败，请检查网络连接或稍后重试";

		// Validate that we have either src or placeId
		if (!src && !placeId) {
			console.warn("Google Maps directive: Either 'src' or 'placeId' attribute is required");
			return;
		}

		// Create iframe element with basic error handling
		const iframeProps: Record<string, string> = {
			src: src || "",
			width: width,
			height: height,
			title: title,
			loading: "lazy",
			style: "border:0;",
			allowfullscreen: "",
			referrerpolicy: "no-referrer-when-downgrade",
			class: "rounded-lg shadow-sm w-full my-6",
		};

		// Create the iframe element using the h function
		const iframeElement = h("iframe", iframeProps);

		// Replace the directive with the iframe element
		parent.children[index] = iframeElement;
	});
};
