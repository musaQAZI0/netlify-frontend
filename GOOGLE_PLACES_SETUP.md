# 🗺️ Google Places API Setup Guide

## Quick Setup Instructions

### Step 1: Get Your API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable these APIs:
   - **Places API** 
   - **Maps JavaScript API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### Step 2: Add API Key to Your Event Builder
In `event-builder.html`, uncomment and update line 13:

**Replace this:**
```html
<!-- <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initGooglePlaces" async defer></script> -->
```

**With this:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=places&callback=initGooglePlaces" async defer></script>
```

### Step 3: Secure Your API Key (Recommended)
1. In Google Cloud Console, go to your API key
2. Click **Restrict key**
3. Under **Application restrictions**, choose **HTTP referrers**
4. Add your domains:
   - `http://localhost:3000/*` (for development)
   - `https://yourdomain.com/*` (for production)

## 🚀 What You'll Get

### With API Key:
- ✅ Google Places Autocomplete
- ✅ Smart venue suggestions
- ✅ Automatic address parsing
- ✅ Coordinate geocoding
- ✅ Address validation

### Without API Key (Current Mode):
- ✅ Manual location entry
- ✅ All location fields available
- ✅ Form validation
- ✅ Event creation works perfectly

## 💰 Pricing
- Google Places API has a generous free tier
- Most small-medium event platforms stay within free limits
- Only pay when you exceed free usage

## 🔧 Current Status
Your event builder is working in **manual mode** without any errors. Users can still:
- Enter venue names manually
- Add complete address details  
- Create events successfully
- Use all other features normally

The enhanced location fields are already functional - just add the API key when ready!

## 🎯 Testing
Try creating an event now at: http://localhost:3000/event-builder.html

The location section will show all the enhanced fields and work perfectly for manual entry.