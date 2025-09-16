import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { h, isNodeDirective } from "../utils/remark";
import type {
	GoogleMapsEmbedParams,
	GoogleMapsType,
	GoogleMapsPluginOptions,
	CoordinateValidation
} from "../types/google-maps";
import { hasCoordinates, hasPlace, validateCoordinates } from "../types/google-maps";

const DIRECTIVE_NAME = "googlemap";

// Default plugin options
const DEFAULT_OPTIONS: GoogleMapsPluginOptions = {
	defaultZoom: 13,
	defaultHeight: 450,
	defaultWidth: "100%",
	defaultMapType: "roadmap",
	networkTimeout: 3000,
	debug: false
};

export const remarkGoogleMaps: Plugin<[GoogleMapsPluginOptions?], Root> = (options = {}) => (tree) => {
	const config = { ...DEFAULT_OPTIONS, ...options };
	visit(tree, (node, index, parent) => {
		if (!parent || index === undefined || !isNodeDirective(node)) return;

		// We only want a leaf directive named DIRECTIVE_NAME
		if (node.type !== "leafDirective" || node.name !== DIRECTIVE_NAME) return;

		// Get parameters from attributes
		const params: GoogleMapsEmbedParams = {
			lat: node.attributes?.lat,
			lng: node.attributes?.lng,
			place: node.attributes?.place,
			zoom: node.attributes?.zoom || config.defaultZoom.toString(),
			width: node.attributes?.width || config.defaultWidth,
			height: node.attributes?.height || config.defaultHeight.toString(),
			maptype: (node.attributes?.maptype as GoogleMapsType) || config.defaultMapType,
			language: node.attributes?.language || "en",
			region: node.attributes?.region || "US"
		};

		// Validate parameters
		if (!hasCoordinates(params) && !hasPlace(params)) {
			if (config.debug) {
				console.warn('[GOOGLE-MAPS] Missing required parameters: either lat+lng or place must be provided');
			}
			return;
		}

		// Validate coordinates if provided
		if (hasCoordinates(params)) {
			const validation = validateCoordinates(params.lat, params.lng);
			if (!validation.valid) {
				if (config.debug) {
					console.warn(`[GOOGLE-MAPS] Invalid coordinates: ${validation.error}`);
				}
				return;
			}
		}

		const SimpleUUID = `GM-${crypto.randomUUID()}`;

		// Generate Google Maps embed URL with enhanced parameters
		const embedUrl = generateEmbedUrl(params, config);

		if (!embedUrl) {
			if (config.debug) {
				console.warn('[GOOGLE-MAPS] Failed to generate embed URL');
			}
			return;
		}

		// Create the script that will check network connectivity and load the map
		const script = h("script", {}, [
			{
				type: "text",
				value: `
				(function() {
					const mapContainer = document.getElementById('${SimpleUUID}');
					const debugMode = ${config.debug || false};
					const networkTimeout = ${config.networkTimeout || 3000};

					// Enhanced logging function
					function log(message, type = 'info') {
						if (debugMode) {
							console[type]('[GOOGLE-MAPS]', message);
						}
					}

					// Function to test if Google Maps is accessible with enhanced error handling
					function testGoogleMapsAccess() {
						return new Promise((resolve) => {
							const startTime = Date.now();
							const controller = new AbortController();
							const timeoutId = setTimeout(() => {
								controller.abort();
								log('Network test timed out after ' + networkTimeout + 'ms', 'warn');
							}, networkTimeout);

							// Try multiple endpoints for better reliability
							const testEndpoints = [
								'https://www.google.com/maps/embed',
								'https://maps.googleapis.com/maps/api/js',
								'https://maps.google.com'
							];

							let testsPassed = 0;
							let testsCompleted = 0;
							const totalTests = testEndpoints.length;

							testEndpoints.forEach(endpoint => {
								fetch(endpoint, {
									method: 'HEAD',
									signal: controller.signal,
									mode: 'no-cors'
								})
								.then(() => {
									testsPassed++;
									testsCompleted++;
									checkCompletion();
								})
								.catch((error) => {
									testsCompleted++;
									log('Test failed for ' + endpoint + ': ' + error.message, 'warn');
									checkCompletion();
								});
							});

							function checkCompletion() {
								if (testsCompleted === totalTests) {
									clearTimeout(timeoutId);
									const responseTime = Date.now() - startTime;
									const accessible = testsPassed > 0;

									log('Network test completed: ' + testsPassed + '/' + totalTests + ' endpoints accessible in ' + responseTime + 'ms');
									resolve(accessible);
								}
							}
						});
					}
					
					// Enhanced function to load the map with error handling
					function loadMap() {
						try {
							log('Loading Google Maps iframe');
							mapContainer.classList.remove('gm-loading');
							mapContainer.classList.add('gm-loaded');

							// Clear loading text
							mapContainer.innerHTML = '';

							const iframe = document.createElement('iframe');
							iframe.src = '${embedUrl}';
							iframe.width = '${params.width}';
							iframe.height = '${params.height}';
							iframe.style.border = '0';
							iframe.style.width = '100%';
							iframe.style.borderRadius = '8px';
							iframe.allowFullscreen = true;
							iframe.loading = 'lazy';
							iframe.referrerPolicy = 'no-referrer-when-downgrade';
							iframe.title = 'Google Maps - ${hasCoordinates(params) ? `Location at ${params.lat}, ${params.lng}` : params.place}';

							// Add error handling for iframe loading
							iframe.onerror = function() {
								log('Iframe failed to load', 'error');
								handleError('IFRAME_LOAD_ERROR');
							};

							iframe.onload = function() {
								log('Google Maps iframe loaded successfully');
							};

							mapContainer.appendChild(iframe);
						} catch (error) {
							log('Error loading map: ' + error.message, 'error');
							handleError('LOAD_ERROR');
						}
					}

					// Enhanced error handling function
					function handleError(errorType = 'NETWORK_ERROR') {
						log('Handling error: ' + errorType, 'error');

						mapContainer.classList.remove('gm-loading');
						mapContainer.classList.add('gm-error');

						// Completely hide the container to not occupy space
						mapContainer.style.display = 'none';
						mapContainer.style.height = '0';
						mapContainer.style.margin = '0';
						mapContainer.style.padding = '0';

						// Dispatch custom event for external error handling
						if (typeof window !== 'undefined' && window.dispatchEvent) {
							const event = new CustomEvent('googlemaps-error', {
								detail: {
									containerId: '${SimpleUUID}',
									errorType: errorType,
									params: ${JSON.stringify(params)}
								}
							});
							window.dispatchEvent(event);
						}
					}
					
					// Test network access and load map if available with enhanced error handling
					log('Starting Google Maps accessibility test');

					testGoogleMapsAccess()
						.then(accessible => {
							if (accessible) {
								log('Google Maps is accessible, loading map');
								loadMap();
							} else {
								log('Google Maps is not accessible, hiding container');
								handleError('NETWORK_INACCESSIBLE');
							}
						})
						.catch((error) => {
							log('Network test failed: ' + error.message, 'error');
							handleError('NETWORK_TEST_FAILED');
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

		// Create the map container with enhanced attributes
		const mapContainer = h("div", {
			id: SimpleUUID,
			class: "google-maps-container gm-loading",
			"data-map-type": params.maptype,
			"data-zoom": params.zoom,
			"data-location": hasCoordinates(params) ? `${params.lat},${params.lng}` : params.place,
			style: `width: 100%; min-height: ${params.height}px;`,
			role: "img",
			"aria-label": hasCoordinates(params)
				? `Google Maps showing location at coordinates ${params.lat}, ${params.lng}`
				: `Google Maps showing ${params.place}`
		}, [
			loadingText,
			script,
		]);

		parent.children.splice(index, 1, mapContainer);
	});
};

/**
 * Generate Google Maps embed URL with enhanced parameters
 */
function generateEmbedUrl(params: GoogleMapsEmbedParams, config: GoogleMapsPluginOptions): string {
	const zoom = params.zoom || config.defaultZoom?.toString() || "13";
	const maptype = params.maptype || config.defaultMapType || "roadmap";
	const language = params.language || "en";
	const region = params.region || "US";

	// Map type parameter for Google Maps embed
	const maptypeParam = getMapTypeParam(maptype);

	if (hasCoordinates(params)) {
		// Use coordinates - create embed URL with coordinates and enhanced parameters
		const lat = parseFloat(params.lat);
		const lng = parseFloat(params.lng);

		// Calculate appropriate distance based on zoom level for better map display
		const distance = Math.round(156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, parseInt(zoom)));

		return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d${distance}!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f${zoom}.1!5e${maptypeParam}!3m2!1s${language}!2s${region}`;
	} else if (hasPlace(params)) {
		// For place names, use the query parameter format with enhanced parameters
		const encodedPlace = encodeURIComponent(params.place);
		return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f${zoom}.1!3m3!1m2!1s0x0%3A0x0!2s${encodedPlace}!5e${maptypeParam}!3m2!1s${language}!2s${region}`;
	}

	return "";
}

/**
 * Convert map type to Google Maps embed parameter
 */
function getMapTypeParam(maptype: GoogleMapsType): string {
	switch (maptype) {
		case 'satellite':
			return '1'; // Satellite view
		case 'hybrid':
			return '2'; // Hybrid view (satellite + roads)
		case 'terrain':
			return '3'; // Terrain view
		case 'roadmap':
		default:
			return '0'; // Default roadmap view
	}
}
