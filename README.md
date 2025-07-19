# School Planner

A modern, customizable, and user-friendly school timetable and subject planner built with React, TypeScript, and Vite.

---

## Features

### 📅 Timetable Import & Parsing
- **Upload your school timetable** as a `.ics` (iCalendar) file.
- **Automatic parsing** of events, including support for:
  - Event times and durations
  - Locations
  - Descriptions (including teacher and period info)
- **Smart week detection:** Finds the week with the most events for your main view.

### 🏠 Home Dashboard
- **Today's (or next) schedule** at a glance, with clear time, subject, and location info.
- **Breaks** are automatically detected and visually separated.
- **Dynamic greeting** based on the time of day and your name.

### 📚 Subject Management (Markbook)
- **Automatic subject extraction** from your calendar.
- **Auto-naming:** Subjects are renamed based on common keywords (e.g., "math" → "Mathematics").
- **Edit subject names and colors** with a color palette or custom color picker.
- **Merge subjects** by renaming to an existing subject name.

### 🗓️ Weekly Calendar View
- **Visual weekly grid** (Monday–Friday) showing all your events.
- **Color-coded subjects** for easy identification.
- **Icons** for common subjects (Math, Science, Music, etc.).
- **Hover for details:** See time, location, teacher, and period info.

### 🎨 Customization & Theming
- **Multiple color themes** (red, orange, yellow, green, blue, purple, pink, grey).
- **Normal and Extreme color modes** for each theme.
- **Light, dark, and system theme modes**.
- **Theme selection modal** for easy switching.

### ⚙️ Settings & Personalization
- **Edit your name** (used for greetings).
- **Clear all data** (timetable, subjects, and settings) with one click.
- **Toggle auto-naming** for subjects.
- **Customize which event info is shown by default** (time, location, teacher, period).
- **Drag-and-drop to reorder info fields**.
- **Choose whether to show the first info field beside the subject name.**
- **Offline caching** - Save the site for offline use so it works without internet connection.

### 🧑‍💻 Modern UX
- **Responsive design** for desktop and mobile.
- **Animated transitions** and modals.
- **Accessible color contrast and keyboard navigation.**
- **Sidebar navigation** for Home, Calendar, Markbook, and Settings.

---

## Getting Started
  Just go to react-schoolplanner.pages.dev! It's that simple, and all of your data stays on your device.

1. **On first launch:**  
   - Enter your name (optional).
   - Upload your `.ics` timetable file.
2. **Explore your Home and Calendar views.**
3. **Edit subjects** in the Markbook tab.
4. **Customize your theme and settings** in the Settings tab.

---

## File Structure

- `src/schoolplanner.tsx` — Main app logic and UI.
- `src/utils/theme.ts` — Theme and color configuration.
- `src/utils/cacheUtils.ts` — Service worker and offline caching utilities.
- `public/sw.js` — Service worker for offline functionality.
- `public/` — Static assets (including favicon).
- `index.html` — App entry point.

---

## Customization

- **Favicon:**  
  Replace `public/school.svg` and update `<link rel="icon" href="/school.svg">` in `index.html`.
- **App Title:**  
  Edit `<title>School Planner</title>` in `index.html`.

---

## Dependencies

- React, ReactDOM
- TypeScript
- Vite
- lucide-react (icons)
- react-router-dom (routing)
- Tailwind CSS (styling)

---

## Offline Functionality

The School Planner supports offline use through Progressive Web App (PWA) features:

### Enabling Offline Mode
1. Go to **Settings** → **Data** section
2. Toggle **"Save Site for Offline Use"** to enable
3. The app will cache necessary files for offline access
4. You'll receive a notification when offline mode is enabled

### How It Works
- **Service Worker**: Caches the app files in your browser
- **Automatic Updates**: When you visit the site online, the cache is updated
- **Offline Access**: Once cached, the app works without internet connection
- **Data Persistence**: Your timetable data is stored locally and works offline

### Clearing Cache
- **Manual**: Toggle off "Save Site for Offline Use" in Settings
- **Automatic**: Using "Clear Data" will also remove the offline cache
- **Browser**: You can also clear the cache through your browser's developer tools

### Browser Support
- **Supported**: Chrome, Firefox, Safari, Edge (modern versions)
- **Not Supported**: Internet Explorer, very old browsers

---

## License
Apache License 2.0
Check the Licensing file for additional Licensing information.
