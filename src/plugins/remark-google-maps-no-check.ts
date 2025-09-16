import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import type { ContainerDirective } from 'mdast-util-directive';
import { h } from 'hastscript';

// Types
interface GoogleMapsEmbedParams {
	lat?: string;
	lng?: string;
	place?: string;
	zoom?: string;
	height?: string;
	maptype?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
	language?: string;
	region?: string;
}

interface GoogleMapsPluginOptions {
	debug?: boolean;
	defaultZoom?: number;
	defaultHeight?: string;
	defaultMapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
	networkTimeout?: number;
}

// Generate Google Maps embed URL (no network check version)
function generateEmbedUrl(params: GoogleMapsEmbedParams, config: GoogleMapsPluginOptions): string {
	const zoom = parseFloat(params.zoom || config.defaultZoom?.toString() || "13");
	const language = params.language || "zh-CN";
	const region = params.region || "s";
	
	function getMapTypeParam(maptype: string): string {
		switch (maptype) {
			case 'satellite': return '1';
			case 'hybrid': return '2';
			case 'terrain': return '4';
			case 'roadmap':
			default: return '0';
		}
	}
	
	if (params.lat && params.lng) {
		const lat = parseFloat(params.lat);
		const lng = parseFloat(params.lng);
		
		const distance = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
		const timestamp = Date.now();
		const mapTypeParam = getMapTypeParam(params.maptype || config.defaultMapType || "roadmap");
		
		const placeId = '0x0:0x0';
		const placeName = `${lat},${lng}`;
		
		const pb = [
			'!1m18',
			'!1m12',
			'!1m3',
			`!1d${distance}`,
			`!2d${lng}`,
			`!3d${lat}`,
			'!2m3',
			'!1f0',
			'!2f0',
			'!3f0',
			'!3m2',
			'!1i1024',
			'!2i768',
			`!4f${zoom}.1`,
			'!3m3',
			'!1m2',
			`!1s${placeId}`,
			`!2s${encodeURIComponent(placeName)}`,
			`!5e${mapTypeParam}`,
			'!3m2',
			`!1s${language}`,
			`!2s${region}`,
			`!4v${timestamp}`,
			'!5m2',
			`!1s${language}`,
			`!2s${region}`
		].join('');
		
		return `https://www.google.com/maps/embed?pb=${pb}`;
		
	} else if (params.place) {
		const timestamp = Date.now();
		const mapTypeParam = getMapTypeParam(params.maptype || config.defaultMapType || "roadmap");
		const encodedPlace = encodeURIComponent(params.place);
		const distance = 3000;
		
		const pb = [
			'!1m18',
			'!1m12',
			'!1m3',
			`!1d${distance}`,
			'!2d0',
			'!3d0',
			'!2m3',
			'!1f0',
			'!2f0',
			'!3f0',
			'!3m2',
			'!1i1024',
			'!2i768',
			`!4f${zoom}.1`,
			'!3m3',
			'!1m2',
			'!1s0x0:0x0',
			`!2s${encodedPlace}`,
			`!5e${mapTypeParam}`,
			'!3m2',
			`!1s${language}`,
			`!2s${region}`,
			`!4v${timestamp}`,
			'!5m2',
			`!1s${language}`,
			`!2s${region}`
		].join('');
		
		return `https://www.google.com/maps/embed?pb=${pb}`;
	}
	
	return "";
}

// Validation functions
function hasCoordinates(params: GoogleMapsEmbedParams): boolean {
	return !!(params.lat && params.lng);
}

function hasPlace(params: GoogleMapsEmbedParams): boolean {
	return !!(params.place && params.place.trim());
}

function validateParams(params: GoogleMapsEmbedParams): boolean {
	return hasCoordinates(params) || hasPlace(params);
}

// Main plugin function
export const remarkGoogleMapsNoCheck: Plugin<[GoogleMapsPluginOptions?], Root> = (options = {}) => {
	const config: GoogleMapsPluginOptions = {
		debug: false,
		defaultZoom: 13,
		defaultHeight: "400px",
		defaultMapType: "roadmap",
		networkTimeout: 5000,
		...options,
	};

	return (tree) => {
		visit(tree, 'containerDirective', (node: ContainerDirective) => {
			if (node.name !== 'googlemap') return;

			// Extract parameters from attributes
			const params: GoogleMapsEmbedParams = {};
			if (node.attributes) {
				Object.assign(params, node.attributes);
			}

			// Validate parameters
			if (!validateParams(params)) {
				if (config.debug) {
					console.warn('[GOOGLE-MAPS-NO-CHECK] Invalid parameters:', params);
				}
				return;
			}

			// Generate embed URL
			const embedUrl = generateEmbedUrl(params, config);
			if (!embedUrl) {
				if (config.debug) {
					console.warn('[GOOGLE-MAPS-NO-CHECK] Failed to generate embed URL');
				}
				return;
			}

			// Generate unique ID
			const mapId = `GM-${Math.random().toString(36).substr(2, 9)}`;
			const height = params.height || config.defaultHeight || "400px";

			if (config.debug) {
				console.log('[GOOGLE-MAPS-NO-CHECK] Generated URL:', embedUrl);
			}

			// Create iframe directly (no network check)
			const iframe = h("iframe", {
				src: embedUrl,
				width: "100%",
				height: height,
				style: "border:0; border-radius: 8px;",
				allowfullscreen: true,
				loading: "lazy",
				referrerpolicy: "no-referrer-when-downgrade",
				title: hasCoordinates(params) 
					? `Google Maps - ${params.lat}, ${params.lng}`
					: `Google Maps - ${params.place}`
			});

			// Create container
			const container = h("div", {
				id: mapId,
				class: "google-maps-container",
				style: `margin: 20px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);`
			}, [iframe]);

			// Replace the directive node with the container
			Object.assign(node, container);
		});
	};
};

export default remarkGoogleMapsNoCheck;
