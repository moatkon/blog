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

## Test 4: Different Map Types

### Satellite View (Tokyo)
::googlemap{lat="35.6762" lng="139.6503" zoom="10" maptype="satellite"}

### Hybrid View (Sydney Opera House)
::googlemap{place="Sydney Opera House" height="350" zoom="16" maptype="hybrid"}

### Terrain View (Grand Canyon)
::googlemap{lat="36.1069" lng="-112.1129" zoom="12" maptype="terrain"}

### Roadmap View (London)
::googlemap{lat="51.5074" lng="-0.1278" zoom="12" maptype="roadmap"}

## Test 5: Various Heights and Languages

### Small Map (200px) with Chinese
::googlemap{place="Times Square, New York" height="200" zoom="17" language="zh-CN" region="CN"}

### Large Map (600px) with French
::googlemap{lat="37.7749" lng="-122.4194" height="600" zoom="12" language="fr" region="FR"}

## Test 6: Advanced Features

### High Zoom Satellite View
::googlemap{lat="40.6892" lng="-74.0445" zoom="18" maptype="satellite" height="400"}

### Terrain with Custom Language
::googlemap{place="Mount Fuji, Japan" maptype="terrain" zoom="11" language="ja" region="JP"}

## Features Demonstrated

- ✅ **Coordinates Support**: Using `lat` and `lng` parameters
- ✅ **Place Names**: Using `place` parameter for location search
- ✅ **Custom Heights**: Using `height` parameter (default: 450px)
- ✅ **Zoom Levels**: Using `zoom` parameter (default: 13)
- ✅ **Map Types**: Support for `roadmap`, `satellite`, `hybrid`, `terrain`
- ✅ **Internationalization**: Using `language` and `region` parameters
- ✅ **100% Width**: All maps automatically use full container width
- ✅ **Network Detection**: Enhanced multi-endpoint connectivity testing
- ✅ **Error Handling**: Comprehensive error handling with custom events
- ✅ **Accessibility**: Proper ARIA labels and semantic markup
- ✅ **No Space When Blocked**: Hidden completely if Google Maps is not accessible

## Usage Examples

```markdown
# Basic coordinates
::googlemap{lat="39.9042" lng="116.4074"}

# Place name with custom zoom
::googlemap{place="Eiffel Tower, Paris" zoom="15"}

# Custom height and map type
::googlemap{lat="40.7128" lng="-74.0060" height="300" maptype="satellite"}

# All parameters with internationalization
::googlemap{lat="35.6762" lng="139.6503" zoom="10" height="400" maptype="hybrid" language="ja" region="JP"}

# Terrain view with place name
::googlemap{place="Grand Canyon National Park" maptype="terrain" zoom="12"}
```

## Available Parameters

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `lat` | string | - | Latitude coordinate | `"39.9042"` |
| `lng` | string | - | Longitude coordinate | `"116.4074"` |
| `place` | string | - | Place name for search | `"Eiffel Tower, Paris"` |
| `zoom` | string | `"13"` | Zoom level (1-20) | `"15"` |
| `height` | string | `"450"` | Map height in pixels | `"300"` |
| `maptype` | string | `"roadmap"` | Map type | `"satellite"`, `"hybrid"`, `"terrain"` |
| `language` | string | `"en"` | Interface language | `"zh-CN"`, `"fr"`, `"ja"` |
| `region` | string | `"US"` | Region code | `"CN"`, `"FR"`, `"JP"` |

## Regular Content

This is regular markdown content to ensure the plugin doesn't interfere with normal text. The maps above should only load if Google Maps is accessible from your network. If you're in a region where Google Maps is blocked, the map containers will not occupy any space on the page.

**Note**: The plugin automatically detects network connectivity to Google Maps and gracefully handles cases where the service is not accessible.
