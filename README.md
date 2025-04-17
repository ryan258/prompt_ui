# Creative Toolbox Chrome Extension

A productivity-focused Chrome extension for efficiently capturing, organizing, and injecting reusable text content (AI prompts, snippets, and more) — with robust import/export, accessibility, and a friendly UI.

---

## ✨ Features

- **Save Text as Snippets:** Quickly save selected text from any webpage via the context menu or sidebar.
- **Organize & Edit:** Edit, expand, delete, and favorite your snippets in a clean sidebar interface.
- **Import/Export CSV:** Back up and restore your prompts/snippets with robust CSV import/export (handles Excel/Sheets quirks).
- **Search & Filter:** Instantly search your snippets by title or content.
- **Persistent Storage:** Uses Chrome’s storage API for reliable, profile-specific data storage.
- **Notifications:** Get instant feedback on import/export and other actions.
- **Accessible & Responsive:** Modern design with accessibility in mind.

---

## 🛠 Tech Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **Chrome Extension APIs** (chrome.storage, contextMenus)
- **Jest** + **React Testing Library** for testing

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run in development mode:**
   ```sh
   npm run dev
   ```
3. **Build for production:**
   ```sh
   npm run build
   ```
4. **Load the extension in Chrome:**
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` folder

---

## 📁 Project Structure

```
src/
  background/   # Chrome background scripts (context menu, storage)
  content/      # Content scripts (if any)
  sidebar/      # Main React sidebar app
  shared/       # Shared types and utilities
dist/           # Production build output
public/         # Static assets
```

---

## 📦 Import/Export CSV

- **Export:** Click "Export CSV" to download all your snippets.
- **Import:** Click "Import CSV" and select a CSV file.  
  - The import is robust: it supports quoted fields, Excel/Sheets exports, and skips duplicates.
  - The expected header is:  
    ```
    id,title,content,tags,createdAt,updatedAt,isFavorite
    ```
  - Each row should match this order (empty fields are fine).

---

## 📝 Development Notes

- **Profile-specific data:** Snippets are stored per Chrome profile. To sync between browsers, use the export/import feature.
- **Testing:**  
  ```sh
  npm test
  ```
- **Linting & Formatting:**  
  ```sh
  npm run lint
  npm run format
  ```

---

## 🛡 License

MIT

---

## 💡 Contributing

Pull requests and suggestions are welcome! Please open an issue or PR for bugs, feature requests, or improvements.
