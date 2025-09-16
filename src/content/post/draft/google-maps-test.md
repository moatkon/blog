---
title: "Google Maps Plugin Test"
description: "Testing the Google Maps plugin with various configurations"
publishDate: "2025-01-16"
tags: ["test", "maps", "plugin"]
draft: false
---

# Google Maps Plugin Test

This post demonstrates the Google Maps plugin functionality with various configurations.

## Test 1: Using Coordinates (Beijing)

Using latitude and longitude coordinates for Beijing with default settings:

::googlemap{lat="39.9042" lng="116.4074" zoom="12"}

## Test 2: Using Place Name (Eiffel Tower)

Using a place name search with custom zoom:

::googlemap{place="Eiffel Tower, Paris" zoom="15"}

## Test 3: Custom Height (New York)

Custom height map of New York with lower zoom level:

::googlemap{lat="40.7128" lng="-74.0060" zoom="11" height="300"}

## Test 4: Different Locations

### Tokyo, Japan
::googlemap{lat="35.6762" lng="139.6503" zoom="10"}

### Sydney Opera House
::googlemap{place="Sydney Opera House" height="350" zoom="16"}

### London, UK
::googlemap{lat="51.5074" lng="-0.1278" zoom="12"}

## Test 5: Various Heights

### Small Map (200px)
::googlemap{place="Times Square, New York" height="200" zoom="17"}

### Large Map (600px)
::googlemap{lat="37.7749" lng="-122.4194" height="600" zoom="12"}

## Features Demonstrated

- ✅ **Coordinates Support**: Using `lat` and `lng` parameters
- ✅ **Place Names**: Using `place` parameter for location search
- ✅ **Custom Heights**: Using `height` parameter (default: 450px)
- ✅ **Zoom Levels**: Using `zoom` parameter (default: 13)
- ✅ **100% Width**: All maps automatically use full container width
- ✅ **Network Detection**: Maps only load if Google Maps is accessible
- ✅ **No Space When Blocked**: Hidden completely if Google Maps is not accessible

## Usage Examples

```markdown
# Basic coordinates
::googlemap{lat="39.9042" lng="116.4074"}

# Place name with custom zoom
::googlemap{place="Eiffel Tower, Paris" zoom="15"}

# Custom height
::googlemap{lat="40.7128" lng="-74.0060" height="300"}

# All parameters
::googlemap{lat="35.6762" lng="139.6503" zoom="10" height="400"}
```

## Regular Content

This is regular markdown content to ensure the plugin doesn't interfere with normal text. The maps above should only load if Google Maps is accessible from your network. If you're in a region where Google Maps is blocked, the map containers will not occupy any space on the page.

**Note**: The plugin automatically detects network connectivity to Google Maps and gracefully handles cases where the service is not accessible.
