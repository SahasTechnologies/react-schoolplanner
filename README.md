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

### 🧑‍💻 Modern UX
- **Responsive design** for desktop and mobile.
- **Animated transitions** and modals.
- **Accessible color contrast and keyboard navigation.**
- **Sidebar navigation** for Home, Calendar, Markbook, and Settings.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the app

```bash
npm run dev
```

### 3. Open in your browser

Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

---

## Usage

1. **On first launch:**  
   - Enter your name (optional).
   - Upload your `.ics` timetable file.
2. **Explore your Home and Calendar views.**
3. **Edit subjects** in the Markbook tab.
4. **Customize your theme and settings** in the Settings tab.

---

## File Structure

- `src/schoolplanner.tsx` — Main app logic and UI.
- `src/theme.ts` — Theme and color configuration.
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

## License

MIT
