/**
 * Google Maps Plugin Event Handler
 * 
 * This script provides additional functionality for handling Google Maps plugin events
 * and can be included in your Astro pages to enhance the user experience.
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        enableErrorNotifications: true,
        enableDebugLogging: false,
        retryAttempts: 2,
        retryDelay: 5000 // 5 seconds
    };

    // Error statistics
    const errorStats = {
        total: 0,
        byType: {},
        containers: new Set()
    };

    /**
     * Log function with debug mode support
     */
    function log(message, type = 'info') {
        if (CONFIG.enableDebugLogging) {
            console[type]('[GOOGLE-MAPS-HANDLER]', message);
        }
    }

    /**
     * Show user-friendly error notification
     */
    function showErrorNotification(errorType, containerId) {
        if (!CONFIG.enableErrorNotifications) return;

        const messages = {
            'NETWORK_INACCESSIBLE': '地图服务暂时无法访问，请稍后再试',
            'NETWORK_TEST_FAILED': '网络连接测试失败',
            'IFRAME_LOAD_ERROR': '地图加载失败',
            'LOAD_ERROR': '地图初始化失败',
            'TIMEOUT_ERROR': '地图加载超时'
        };

        const message = messages[errorType] || '地图加载出现未知错误';
        
        // Create a subtle notification
        const notification = document.createElement('div');
        notification.className = 'google-maps-error-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⚠️</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            max-width: 300px;
            font-size: 14px;
            color: #856404;
        `;

        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        notification.querySelector('.notification-close').style.cssText = `
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #856404;
            margin-left: auto;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Retry loading a failed map
     */
    function retryMapLoad(containerId, attempt = 1) {
        if (attempt > CONFIG.retryAttempts) {
            log(`Max retry attempts reached for container ${containerId}`, 'warn');
            return;
        }

        log(`Retrying map load for container ${containerId}, attempt ${attempt}`);

        setTimeout(() => {
            const container = document.getElementById(containerId);
            if (!container) return;

            // Reset container state
            container.classList.remove('gm-error', 'gm-loaded');
            container.classList.add('gm-loading');
            container.style.display = '';
            container.style.height = '';
            container.style.margin = '';
            container.style.padding = '';

            // Add loading text back
            container.innerHTML = '<div class="gm-loading-text" style="color: #666; font-size: 14px;">重新加载地图中...</div>';

            // Trigger a re-test by dispatching a custom event
            const retryEvent = new CustomEvent('googlemaps-retry', {
                detail: { containerId, attempt }
            });
            window.dispatchEvent(retryEvent);

        }, CONFIG.retryDelay * attempt);
    }

    /**
     * Handle Google Maps errors
     */
    function handleGoogleMapsError(event) {
        const { containerId, errorType, params } = event.detail;
        
        log(`Google Maps error: ${errorType} for container ${containerId}`, 'error');
        
        // Update statistics
        errorStats.total++;
        errorStats.byType[errorType] = (errorStats.byType[errorType] || 0) + 1;
        errorStats.containers.add(containerId);

        // Show notification for certain error types
        if (['NETWORK_INACCESSIBLE', 'TIMEOUT_ERROR'].includes(errorType)) {
            showErrorNotification(errorType, containerId);
        }

        // Attempt retry for recoverable errors
        if (['NETWORK_TEST_FAILED', 'IFRAME_LOAD_ERROR'].includes(errorType)) {
            retryMapLoad(containerId);
        }

        // Send analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'google_maps_error', {
                'error_type': errorType,
                'container_id': containerId,
                'custom_parameters': params
            });
        }
    }

    /**
     * Create a fallback static map link
     */
    function createFallbackLink(container, params) {
        const fallbackLink = document.createElement('a');
        fallbackLink.className = 'google-maps-fallback-link';
        fallbackLink.target = '_blank';
        fallbackLink.rel = 'noopener noreferrer';
        
        if (params.lat && params.lng) {
            fallbackLink.href = `https://www.google.com/maps?q=${params.lat},${params.lng}`;
            fallbackLink.textContent = `在 Google 地图中查看 (${params.lat}, ${params.lng})`;
        } else if (params.place) {
            fallbackLink.href = `https://www.google.com/maps/search/${encodeURIComponent(params.place)}`;
            fallbackLink.textContent = `在 Google 地图中搜索 "${params.place}"`;
        }

        fallbackLink.style.cssText = `
            display: inline-block;
            padding: 8px 16px;
            background: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            margin: 10px 0;
        `;

        container.appendChild(fallbackLink);
    }

    /**
     * Get error statistics
     */
    function getErrorStats() {
        return {
            ...errorStats,
            containers: Array.from(errorStats.containers)
        };
    }

    /**
     * Initialize the handler
     */
    function init() {
        log('Initializing Google Maps error handler');

        // Listen for Google Maps errors
        window.addEventListener('googlemaps-error', handleGoogleMapsError);

        // Expose global functions for debugging
        if (CONFIG.enableDebugLogging) {
            window.GoogleMapsHandler = {
                getErrorStats,
                retryMapLoad,
                showErrorNotification,
                config: CONFIG
            };
        }

        log('Google Maps error handler initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
