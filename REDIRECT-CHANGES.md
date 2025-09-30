# Redirect Page Updates

## Changes Made

### ✅ Requirements Implemented

1. **Proper Lucide Icons** - Using real React components instead of emojis:
   - `<GraduationCap />` for school logo (80px, accent color)
   - `<TrendingUp />` next to "We've Moved" heading
   - `<Download />` on export button

2. **No Shadows or Glows** - Removed all `boxShadow` effects

3. **Export Modal Integration** - Created `ExportModal.tsx`:
   - Shows the same export options as Settings
   - User can select what data to export
   - Opens proper modal instead of auto-downloading

4. **Domain Button** - URL box is now a clickable button:
   - Goes to new site when clicked
   - Removed the separate "Continue to New Site" button

5. **Error Code** - Added `ERR_301_MOVED_PERMANENTLY`:
   - Displayed in small monospace font
   - Positioned under the domain button
   - Muted color with reduced opacity

6. **No Emojis** - All replaced with Lucide icon components

## File Structure

```
src/
├── main.tsx                     # Domain detection logic
├── components/
│   ├── RedirectPage.tsx        # Main redirect page (updated)
│   └── ExportModal.tsx         # New export modal component
```

## How It Works

1. User visits `*.pages.dev` domain
2. Sees redirect page with:
   - School logo (GraduationCap icon)
   - "We've Moved" with TrendingUp icon
   - Clickable domain button
   - ERR_301 code below
   - Export button
3. Clicks "Export My Data"
4. Modal opens with checkboxes for:
   - Subjects
   - Subject Info/Notes/Colors/Icons
   - Name
   - Exams & Markbook
   - Links
   - All Preferences
5. User selects options and clicks Export
6. `.school` file downloads
7. User clicks domain button to go to new site
8. Imports `.school` file via Settings

## Visual Design

- Theme-aware (detects system dark/light mode)
- Clean card design with borders
- No shadows or glows
- Subtle hover animations (lift on buttons)
- Proper spacing and typography
- Monospace error code for authenticity
