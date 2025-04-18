# Creative Toolbox - Chrome Extension Masterplan

## Project Overview

Creative Toolbox is a Chrome extension designed to help users efficiently capture, organize, and inject reusable text content across web applications. The primary use case focuses on managing AI prompts with accessibility as a core consideration, particularly for users who need to minimize typing effort.

## Target Audience

The primary user is someone who:
- Uses multiple AI platforms and needs to manage prompts across them
- Requires accessibility features that minimize typing
- Prefers quick, efficient workflows with minimal clicks
- Needs to organize content via a flexible tagging system

## Core Objectives

1. Create a sidebar extension that makes prompt management simple and accessible
2. Minimize the effort required to save, find, and reuse text content
3. Provide robust organization via tags and search
4. Ensure data persistence and backup options to prevent loss
5. Maintain a bright, modern UI that stands out against dark mode applications

## Technical Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite (recommended for faster development)
- **Storage**: 
  - Primary: chrome.storage.local (backed by IndexedDB)
  - Backup: Export/Import functionality (Phase 1)
  - Sync: chrome.storage.sync (Phase 2)
- **UI Library**: Consider Tailwind CSS for rapid, accessible UI development
- **Testing**: Jest and React Testing Library

## Feature Roadmap

### Phase 1: Core MVP

#### Sidebar UI
- Dockable, collapsible sidebar with bright, modern design
- Snippet list with multi-line previews (up to 3 lines) and expand/collapse buttons
- Tag filtering system with free-form tag creation
- Search functionality across all prompts
- Simple settings panel
- Snippet cards can be expanded/collapsed independently; multiple can be open at once

#### Content Management
- Right-click context menu to save selected text
- One-click insertion of prompts into focused form fields
- Basic snippet editing functionality
- Manual delete capability

#### Storage & Backup
- Local storage persistence using chrome.storage.local
- Export/import functionality for manual backups
- Automatic capturing of source URL for reference

#### Accessibility Features
- High contrast, bright modern UI
- One-click insertion to minimize effort
- Keyboard shortcuts for common actions
- Proper ARIA attributes and screen reader compatibility
- All interactive elements are keyboard accessible; expand/collapse works with keyboard and screen readers

### Phase 2: Enhanced Organization

#### Advanced Tagging
- Tag management (rename, delete)
- Color-coding for visual identification
- Multi-tag filtering with AND/OR logic
- Tag-based grouping in the sidebar

#### Improved Content Management
- Enhanced search with filters
- Bulk operations (tag multiple items)
- Snippet version history
- Custom ordering/sorting options

#### Enhanced Injection
- Support for more complex form fields
- Format preservation options
- Additional keyboard shortcuts

#### Synchronization
- Implement chrome.storage.sync for cross-device use
- Conflict resolution strategy

#### UI/UX Improvements
- Customizable sidebar width
- Refined onboarding process
- UI preference settings (font size, contrast)
- Refactor large components (like SidebarApp) into smaller, focused components (e.g., SnippetCard, TagFilter, ImportExportPanel, Notification) for maintainability and scalability.
- Centralize utility functions for CSV/tags/cleaning to reduce duplication and improve reliability.
- Adopt a robust CSV parsing library (e.g., PapaParse) for import/export reliability and edge case handling.
- Expand test coverage for edge cases, accessibility, and error handling.
- Consider using useReducer or React context for more scalable state management as the app grows.
- Prepare for scale: implement list virtualization (e.g., react-window) for handling large numbers of snippets efficiently.
- Add a global error boundary for React to catch unexpected UI errors and improve user feedback.

### Phase 3: Power Features

#### Template Variables
- Support for dynamic variables in prompts
- Date/time insertion
- Simple form for variable values

#### Advanced Accessibility
- Voice command support (investigation)
- Additional keyboard navigation enhancements
- High contrast mode options

#### Robust Cloud Sync
- Optional connection to dedicated cloud storage
- End-to-end encryption for sensitive prompts
- Multi-device real-time sync

#### Collaboration (Optional)
- Sharing snippets with others
- Collaborative libraries
- Access control settings

## Data Model

### Snippet Object
```typescript
interface Snippet {
  id: string;               // Unique identifier
  title: string;            // User-defined or auto-generated
  content: string;          // The actual prompt/snippet
  tags: string[];           // Array of tag names
  createdAt: number;        // Timestamp
  updatedAt: number;        // Timestamp
  sourceUrl?: string;       // Optional, for reference
  isFavorite: boolean;      // Quick access flag
}
```

### Tag Object
```typescript
interface Tag {
  id: string;               // Unique identifier
  name: string;             // Tag name
  color?: string;           // Optional, for Phase 2+
  snippetCount: number;     // For UI display
}
```

## UI Design Principles

1. **Clarity**: Clean, uncluttered interface with sufficient whitespace
2. **Contrast**: Bright, high-contrast elements that stand out on dark backgrounds
3. **Efficiency**: Minimize clicks required for common actions
4. **Consistency**: Uniform behavior across the application
5. **Feedback**: Clear visual feedback for user actions
6. **Adaptability**: Responsive to different sidebar widths
7. **Accessibility**: WCAG AA compliance at minimum

## Technical Architecture

### Components
1. **Sidebar UI Panel**: React-based interface loaded into Chrome's side panel
2. **Background Service Worker**: Handles storage, context menu, and core logic
3. **Content Script**: Manages text selection and injection into web pages

### Communication Flow
- Sidebar ↔ Background: chrome.runtime.sendMessage
- Content Script ↔ Background: chrome.runtime.sendMessage
- UI updates: chrome.storage.onChanged listeners

## Storage Strategy

### Local Storage (Phase 1)
- Use chrome.storage.local for primary storage
- Implement periodic auto-save
- Export/import functionality using JSON files

### Sync Storage (Phase 2)
- Add chrome.storage.sync support
- Implement last-write-wins conflict resolution
- Storage size monitoring and management

### Cloud Storage (Phase 3)
- Optional connection to dedicated backend
- OAuth authentication
- Encrypted storage of sensitive content

## Security Considerations

1. Content Sanitization: Ensure stored HTML is properly sanitized
2. Permission Management: Request only necessary permissions
3. Data Privacy: All data stays local in Phase 1, with explicit user control over sync in later phases
4. Content Isolation: Proper isolation between extension and web page contexts

## Development Milestones

### Phase 1 (MVP)
1. **Week 1-2**: Project setup, architecture, and basic UI components
2. **Week 3-4**: Storage implementation and snippet management
3. **Week 5-6**: Context menu and basic content injection
4. **Week 7-8**: Testing, refinement, and export/import functionality

### Phase 2
1. **Week 1-3**: Advanced tagging system and improved search
2. **Week 4-6**: Sync implementation and conflict resolution
3. **Week 7-8**: UI improvements and enhanced injection capabilities
4. **Week 9-10**: Testing and refinement

### Phase 3
1. **Week 1-3**: Template variables implementation
2. **Week 4-6**: Cloud sync infrastructure (if pursued)
3. **Week 7-9**: Advanced accessibility features
4. **Week 10-12**: Testing, refinement, and optimization

## Potential Challenges and Solutions

### Content Injection Reliability
- **Challenge**: Consistent insertion across diverse web applications
- **Solution**: Start with standard form fields, then gradually add support for complex editors with specific adapters

### Performance at Scale
- **Challenge**: Maintaining responsiveness with large numbers of snippets
- **Solution**: Implement virtualized lists, pagination, efficient indexing

### Data Loss Prevention
- **Challenge**: Ensuring user data is never lost
- **Solution**: Auto-save, export/import, eventual sync, clear error handling

### Accessibility Edge Cases
- **Challenge**: Meeting diverse accessibility needs
- **Solution**: Adhere to WCAG standards, provide customization options, regular accessibility audits

## Future Expansion Possibilities

1. **Browser Support**: Expand to Firefox, Edge, and other browsers
2. **AI Integration**: Potential integration with AI services for smart tagging or content generation
3. **Desktop Application**: Companion app for managing content outside the browser
4. **Mobile Support**: Browser extension for mobile browsers where supported
5. **API Integration**: Direct connection to user's preferred applications

## Success Metrics

1. **Usability**: Reduction in time spent managing and reusing prompts
2. **Reliability**: Zero data loss incidents
3. **Performance**: Sidebar loads in under 1 second, operations feel instant
4. **Accessibility**: Meets WCAG AA standards
5. **User Satisfaction**: Meets the specific needs of the primary user

## Conclusion

This masterplan outlines a comprehensive approach to building the Creative Toolbox Chrome extension with a focus on accessibility, efficiency, and reliability. The phased development approach ensures that core functionality is delivered quickly while setting the foundation for more advanced features in the future.

By prioritizing the specific needs of the primary user—managing AI prompts with minimal typing effort—the Creative Toolbox aims to be an indispensable tool that significantly enhances productivity and reduces cognitive load.