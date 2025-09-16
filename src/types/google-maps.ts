/**
 * Google Maps Plugin Types
 * 
 * Type definitions for the Google Maps remark plugin
 */

/**
 * Google Maps embed URL parameters
 */
export interface GoogleMapsEmbedParams {
	/** Latitude coordinate */
	lat?: string;
	/** Longitude coordinate */
	lng?: string;
	/** Place name for search */
	place?: string;
	/** Zoom level (1-20) */
	zoom?: string;
	/** Map width (CSS value) */
	width?: string;
	/** Map height in pixels */
	height?: string;
	/** Map type */
	maptype?: GoogleMapsType;
	/** Language code */
	language?: string;
	/** Region code */
	region?: string;
}

/**
 * Google Maps types
 */
export type GoogleMapsType = 
	| 'roadmap'    // Default road map
	| 'satellite'  // Satellite imagery
	| 'hybrid'     // Satellite imagery with road overlay
	| 'terrain';   // Terrain map

/**
 * Plugin configuration options
 */
export interface GoogleMapsPluginOptions {
	/** Default zoom level */
	defaultZoom?: number;
	/** Default height in pixels */
	defaultHeight?: number;
	/** Default width (CSS value) */
	defaultWidth?: string;
	/** Default map type */
	defaultMapType?: GoogleMapsType;
	/** Network timeout in milliseconds */
	networkTimeout?: number;
	/** Enable debug logging */
	debug?: boolean;
}

/**
 * Internal plugin state
 */
export interface GoogleMapsPluginState {
	/** Unique identifier for the map container */
	containerId: string;
	/** Generated embed URL */
	embedUrl: string;
	/** Map parameters */
	params: GoogleMapsEmbedParams;
	/** Loading state */
	isLoading: boolean;
	/** Error state */
	hasError: boolean;
}

/**
 * Network connectivity test result
 */
export interface NetworkTestResult {
	/** Whether Google Maps is accessible */
	accessible: boolean;
	/** Response time in milliseconds */
	responseTime?: number;
	/** Error message if test failed */
	error?: string;
}

/**
 * Map container element interface
 */
export interface GoogleMapsContainer extends HTMLElement {
	/** Container ID */
	id: string;
	/** Loading state class */
	classList: DOMTokenList;
	/** Container style */
	style: CSSStyleDeclaration;
	/** Child iframe element */
	querySelector: (selector: string) => Element | null;
	/** Append child element */
	appendChild: (child: Node) => Node;
	/** Set inner HTML */
	innerHTML: string;
}

/**
 * Coordinate validation result
 */
export interface CoordinateValidation {
	/** Whether coordinates are valid */
	valid: boolean;
	/** Parsed latitude */
	lat?: number;
	/** Parsed longitude */
	lng?: number;
	/** Error message if invalid */
	error?: string;
}

/**
 * Plugin error types
 */
export enum GoogleMapsErrorType {
	INVALID_PARAMS = 'INVALID_PARAMS',
	NETWORK_ERROR = 'NETWORK_ERROR',
	TIMEOUT_ERROR = 'TIMEOUT_ERROR',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Plugin error interface
 */
export interface GoogleMapsError {
	/** Error type */
	type: GoogleMapsErrorType;
	/** Error message */
	message: string;
	/** Original error object */
	originalError?: Error;
	/** Map parameters that caused the error */
	params?: GoogleMapsEmbedParams;
}

/**
 * Utility type for required coordinate parameters
 */
export type CoordinateParams = {
	lat: string;
	lng: string;
	place?: never;
} | {
	lat?: never;
	lng?: never;
	place: string;
};

/**
 * Complete Google Maps directive parameters
 */
export type GoogleMapsDirectiveParams = CoordinateParams & {
	zoom?: string;
	width?: string;
	height?: string;
	maptype?: GoogleMapsType;
	language?: string;
	region?: string;
};

/**
 * Type guard to check if parameters have coordinates
 */
export function hasCoordinates(params: GoogleMapsEmbedParams): params is GoogleMapsEmbedParams & { lat: string; lng: string } {
	return typeof params.lat === 'string' && typeof params.lng === 'string';
}

/**
 * Type guard to check if parameters have place name
 */
export function hasPlace(params: GoogleMapsEmbedParams): params is GoogleMapsEmbedParams & { place: string } {
	return typeof params.place === 'string' && params.place.length > 0;
}

/**
 * Validate coordinate values
 */
export function validateCoordinates(lat: string, lng: string): CoordinateValidation {
	const latNum = parseFloat(lat);
	const lngNum = parseFloat(lng);
	
	if (isNaN(latNum) || isNaN(lngNum)) {
		return {
			valid: false,
			error: 'Coordinates must be valid numbers'
		};
	}
	
	if (latNum < -90 || latNum > 90) {
		return {
			valid: false,
			error: 'Latitude must be between -90 and 90'
		};
	}
	
	if (lngNum < -180 || lngNum > 180) {
		return {
			valid: false,
			error: 'Longitude must be between -180 and 180'
		};
	}
	
	return {
		valid: true,
		lat: latNum,
		lng: lngNum
	};
}
