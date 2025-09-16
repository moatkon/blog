import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { h, isNodeDirective } from "../utils/remark";

const DIRECTIVE_NAME = "googlemap";

export const remarkGoogleMaps: Plugin<[], Root> = () => (tree) => {
	visit(tree, (node, index, parent) => {
		if (!parent || index === undefined || !isNodeDirective(node)) return;

		// We only want a leaf directive named DIRECTIVE_NAME
		if (node.type !== "leafDirective" || node.name !== DIRECTIVE_NAME) return;

		// Get parameters from attributes
		const lat = node.attributes?.lat;
		const lng = node.attributes?.lng;
		const zoom = node.attributes?.zoom || "13";
		const width = node.attributes?.width || "100%";
		const height = node.attributes?.height || "450";
		const place = node.attributes?.place;

		// Either lat/lng or place is required
		if (!lat && !lng && !place) return;

		const SimpleUUID = `GM-${crypto.randomUUID()}`;
		
		// Generate Google Maps embed URL
		let embedUrl = "";
		if (lat && lng) {
			// Use coordinates - create a simple embed URL with coordinates
			// This format works without API key for basic embedding
			embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f${zoom}.1!5e0!3m2!1sen!2sus`;
		} else if (place) {
			// For place names, use the query parameter format
			// This is a simpler approach that works for most places
			embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f${zoom}.1!3m3!1m2!1s0x0%3A0x0!2s${encodeURIComponent(place)}!5e0!3m2!1sen!2sus`;
		}

		// Create the script that will check network connectivity and load the map
		const script = h("script", {}, [
			{
				type: "text",
				value: `
				(function() {
					const mapContainer = document.getElementById('${SimpleUUID}');
					
					// Function to test if Google Maps is accessible
					function testGoogleMapsAccess() {
						return new Promise((resolve) => {
							// Try to fetch a simple request to Google Maps to test connectivity
							const controller = new AbortController();
							const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

							fetch('https://www.google.com/maps/embed', {
								method: 'HEAD',
								signal: controller.signal,
								mode: 'no-cors' // This allows the request even if CORS is blocked
							})
							.then(() => {
								clearTimeout(timeoutId);
								resolve(true);
							})
							.catch(() => {
								clearTimeout(timeoutId);
								resolve(false);
							});
						});
					}
					
					// Function to load the map
					function loadMap() {
						mapContainer.classList.remove('gm-loading');
						mapContainer.classList.add('gm-loaded');
						
						// Clear loading text
						mapContainer.innerHTML = '';
						
						const iframe = document.createElement('iframe');
						iframe.src = '${embedUrl}';
						iframe.width = '${width}';
						iframe.height = '${height}';
						iframe.style.border = '0';
						iframe.style.width = '100%';
						iframe.style.borderRadius = '8px';
						iframe.allowFullscreen = true;
						iframe.loading = 'lazy';
						iframe.referrerPolicy = 'no-referrer-when-downgrade';
						
						mapContainer.appendChild(iframe);
					}
					
					// Function to handle error - completely hide the container
					function handleError() {
						mapContainer.style.display = 'none';
						mapContainer.style.height = '0';
						mapContainer.style.margin = '0';
						mapContainer.style.padding = '0';
						console.log('[GOOGLE-MAPS] Google Maps is not accessible, hiding map container');
					}
					
					// Test network access and load map if available
					testGoogleMapsAccess()
						.then(accessible => {
							if (accessible) {
								loadMap();
							} else {
								handleError();
							}
						})
						.catch(() => {
							handleError();
						});
				})();
			`,
			},
		]);

		// Create loading text element
		const loadingText = h("div", { 
			class: "gm-loading-text",
			style: "color: #666; font-size: 14px;"
		}, [
			{ type: "text", value: "Loading Google Maps..." }
		]);

		// Create the map container
		const mapContainer = h("div", { 
			id: SimpleUUID, 
			class: "google-maps-container gm-loading",
			style: `width: 100%; min-height: ${height}px; border-radius: 8px; overflow: hidden; background: #f5f5f5; display: flex; align-items: center; justify-content: center; margin: 1rem 0;`
		}, [
			loadingText,
			script,
		]);

		parent.children.splice(index, 1, mapContainer);
	});
};
