# Creative Toolbox Chrome Extension

A Chrome extension to efficiently capture, organize, and inject reusable text content (AI prompts) with accessibility and productivity in mind.

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS
- chrome.storage APIs
- Jest + React Testing Library

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```
2. Run in development mode:
   ```
   npm run dev
   ```
3. Build for production:
   ```
   npm run build
   ```
4. Load the `dist/` folder as an unpacked extension in Chrome.

## Project Structure

- `src/background/`: Background service worker
- `src/content/`: Content scripts
- `src/sidebar/`: Sidebar React app
- `src/shared/`: Shared types and utilities

## License
MIT
