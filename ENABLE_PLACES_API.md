# 🚀 Enable Google Places API - Step-by-Step Guide

## Why You're Not Seeing Suggestions

Your autocomplete isn't showing suggestions because you need to enable **both** the legacy Places API and the new Places API in Google Cloud Console.

## ✅ Quick Fix Steps (5 Minutes)

### Step 1: Open Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the right project (where your API key was created)

### Step 2: Enable Places API (Legacy)
1. Go to **APIs & Services** → **Library**
2. Search for "**Places API**" (the one without "New" in the name)
3. Click on it and click **Enable**

### Step 3: Enable Places API (New) 
1. Still in **Library**, search for "**Places API (New)**"
2. Click on it and click **Enable**

### Step 4: Verify Your API Key Restrictions
1. Go to **APIs & Services** → **Credentials** 
2. Click on your API key: `AIzaSyAiq2Anse5vuEDCI3oKqD2iezo1MfoOiVk`
3. Under **API restrictions**, make sure these are enabled:
   - Places API
   - Places API (New)
   - Maps JavaScript API

### Step 5: Add HTTP Referrers (Security)
1. Under **Application restrictions**, select **HTTP referrers**
2. Add these referrers:
   ```
   http://localhost:3000/*
   http://localhost/*
   https://yourdomain.com/*
   ```

## 🧪 Test Your Fix

After enabling the APIs:

1. **Option 1:** Test with the dedicated test page
   ```
   http://localhost:3000/test-places-api.html
   ```

2. **Option 2:** Test in your event builder
   ```
   http://localhost:3000/event-builder.html
   ```
   - Go to the Location section
   - Type "New York" or "McDonald's" 
   - You should see suggestions appear

## 🔍 Debugging Console Messages

Open browser console (F12) and look for:

**✅ Success Messages:**
```
✅ Google Places API loaded successfully
✅ Autocomplete initialized for USA only
✅ Autocomplete service working. Sample predictions: [...]
🔍 Manual test for "New York": 5 suggestions found
```

**❌ Error Messages to Watch For:**
```
❌ Autocomplete service error: REQUEST_DENIED
❌ This API project is not authorized to use this API
```

## 💰 Billing Note

Google requires a billing account to be set up, even for the free tier. Don't worry:
- You get $200 free credit monthly
- Places API has very generous free quotas
- Small/medium event sites rarely exceed free limits

## 🎯 Expected Behavior After Fix

When you type in the location field:
1. **After 3+ characters**: Dropdown appears with USA locations
2. **Suggestions include**: Cities, businesses, addresses (USA only)
3. **When selected**: All address fields auto-populate
4. **No more console errors**: Clean, working autocomplete

## ⏰ Takes Effect

Changes take effect immediately after enabling APIs - no waiting period needed.

## 🆘 Still Having Issues?

If suggestions still don't appear after enabling APIs:
1. Clear browser cache and cookies
2. Try in incognito/private mode
3. Check if any browser extensions are blocking scripts
4. Verify billing is enabled in Google Cloud Console

The autocomplete widget is already properly configured for USA-only results - you just need to enable the APIs!