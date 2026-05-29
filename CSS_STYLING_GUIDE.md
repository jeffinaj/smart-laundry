# Smart Laundry System - CSS Styling Guide

## Overview
The Smart Laundry System has professional, modern CSS styling with responsive design, comprehensive components, and accessibility support. All styles are located in `static/css/styles.css`.

---

## 📐 Design System

### Color Palette
- **Primary:** `#2563eb` (Blue) - Main brand color
- **Success:** `#10b981` (Green) - Positive actions
- **Warning:** `#f59e0b` (Amber) - Alerts and warnings
- **Danger:** `#ef4444` (Red) - Destructive actions
- **Gray Scale:** 50-900 (Light to Dark)

### Typography
- **Font Family:** Inter, Segoe UI, system fonts
- **Sizes:** xs (0.75rem) → 4xl (2.25rem)
- **Weights:** Normal (400) → Bold (700)

### Spacing System
- **xs:** 0.25rem
- **sm:** 0.5rem
- **md:** 1rem
- **lg:** 1.5rem
- **xl:** 2rem
- **2xl:** 3rem
- **3xl:** 4rem

### Border Radius
- **sm:** 0.375rem
- **md:** 0.5rem
- **lg:** 0.75rem
- **xl:** 1rem
- **2xl:** 1.5rem
- **full:** 9999px (Pill shape)

### Shadows
- **sm:** Subtle
- **md:** Standard
- **lg:** Elevated
- **xl:** Heavy
- **2xl:** Extra Heavy

### Transitions
- **fast:** 150ms
- **base:** 200ms
- **slow:** 300ms

---

## 🎨 Components

### Buttons
```html
<!-- Primary Button -->
<button class="button">Action Button</button>

<!-- Secondary Button -->
<button class="button-secondary">Secondary</button>

<!-- Button Sizes -->
<button class="button btn-sm">Small</button>
<button class="button btn-lg">Large</button>
<button class="button btn-full">Full Width</button>

<!-- Button Variants -->
<button class="button btn-success">Success</button>
<button class="button btn-danger">Danger</button>
<button class="button btn-warning">Warning</button>
<button class="button btn-outline">Outline</button>
<button class="button btn-ghost">Ghost</button>

<!-- Icon Button -->
<button class="button btn-icon">🔔</button>

<!-- Loading State -->
<button class="button btn-loading">Loading...</button>
```

### Cards
```html
<!-- Basic Card -->
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>

<!-- Elevated Card -->
<div class="card card-elevated">Content</div>

<!-- Flat Card -->
<div class="card card-flat">Content</div>

<!-- Clickable Card -->
<div class="card clickable">Content</div>
```

### Forms
```html
<form class="auth-form">
  <div class="form-group">
    <label>Email Address</label>
    <input type="email" required>
    <span class="form-error">Email is required</span>
    <span class="form-success">Email is valid</span>
  </div>
  
  <div class="form-group has-error">
    <label>Password</label>
    <input type="password">
  </div>

  <div class="form-group has-success">
    <label>Username</label>
    <input type="text">
  </div>
</form>
```

### Badges
```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-danger">Danger</span>
<span class="badge badge-outline">Outline</span>
```

### Alerts
```html
<div class="alert alert-info">
  <div class="alert-icon">ℹ️</div>
  <div class="alert-content">
    <div class="alert-title">Information</div>
    <p class="alert-message">This is an info message</p>
  </div>
</div>

<div class="alert alert-success">
  <div class="alert-icon">✓</div>
  <div class="alert-content">
    <div class="alert-title">Success</div>
    <p class="alert-message">Operation completed</p>
  </div>
</div>

<div class="alert alert-warning">
  <div class="alert-icon">⚠️</div>
  <div class="alert-content">
    <div class="alert-title">Warning</div>
    <p class="alert-message">This is a warning</p>
  </div>
</div>

<div class="alert alert-danger">
  <div class="alert-icon">✕</div>
  <div class="alert-content">
    <div class="alert-title">Error</div>
    <p class="alert-message">Something went wrong</p>
  </div>
  <button class="alert-close">×</button>
</div>
```

### Breadcrumbs
```html
<nav class="breadcrumb">
  <span class="breadcrumb-item"><a href="/">Home</a></span>
  <span class="breadcrumb-item"><a href="/dashboard">Dashboard</a></span>
  <span class="breadcrumb-item active">Orders</span>
</nav>
```

### Tabs
```html
<div class="tabs">
  <button class="tab active" data-tab="tab1">Tab 1</button>
  <button class="tab" data-tab="tab2">Tab 2</button>
  <button class="tab" data-tab="tab3">Tab 3</button>
</div>

<div class="tab-content active" id="tab1">Content 1</div>
<div class="tab-content" id="tab2">Content 2</div>
<div class="tab-content" id="tab3">Content 3</div>
```

### Modals
```html
<div class="modal-overlay open">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Modal Title</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">
      Modal content goes here
    </div>
    <div class="modal-footer">
      <button class="button button-secondary">Cancel</button>
      <button class="button">Confirm</button>
    </div>
  </div>
</div>
```

### Dropdowns
```html
<div class="dropdown open">
  <button class="dropdown-toggle">
    Options
    <span>▼</span>
  </button>
  <ul class="dropdown-menu">
    <li><a class="dropdown-item active" href="#">Option 1</a></li>
    <li><a class="dropdown-item" href="#">Option 2</a></li>
    <li class="dropdown-divider"></li>
    <li><a class="dropdown-item" href="#">Option 3</a></li>
  </ul>
</div>
```

### Progress Bar
```html
<div class="progress-text">
  <span>Loading</span>
  <span>50%</span>
</div>
<div class="progress">
  <div class="progress-bar" style="width: 50%"></div>
</div>
```

### Status Indicators
```html
<span class="status-indicator status-active">Active</span>
<span class="status-indicator status-inactive">Inactive</span>
<span class="status-indicator status-pending">Pending</span>
```

### Rating
```html
<div class="rating">
  <span class="star active">★</span>
  <span class="star active">★</span>
  <span class="star active">★</span>
  <span class="star active">★</span>
  <span class="star empty">★</span>
</div>
```

### Pagination
```html
<div class="pagination">
  <a class="pagination-item" href="#">←</a>
  <a class="pagination-item active" href="#">1</a>
  <a class="pagination-item" href="#">2</a>
  <a class="pagination-item" href="#">3</a>
  <a class="pagination-item" href="#">→</a>
</div>
```

### Tables
```html
<div class="table-responsive">
  <table class="table">
    <thead>
      <tr>
        <th>Header 1</th>
        <th>Header 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Tooltips
```html
<span class="tooltip">
  Hover me
  <span class="tooltip-text">Tooltip text</span>
</span>
```

---

## 🎬 Animations

### Available Animations
- **fadeIn / fadeOut** - Opacity transitions
- **slideInRight / slideInLeft / slideInUp / slideInDown** - Slide transitions
- **pulse** - Pulsing effect
- **bounce** - Bouncing motion
- **spin** - Rotation
- **shimmer** - Shimmer effect (for loading)

### Usage
```html
<div class="animate-fade-in">Fading in...</div>
<div class="animate-slide-in-up">Sliding up...</div>
<div class="animate-pulse">Pulsing...</div>
<div class="animate-spin">Loading...</div>
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile:** < 480px
- **Small Tablet:** 480px - 640px
- **Tablet:** 640px - 768px
- **Large Tablet:** 768px - 1024px
- **Desktop:** 1024px - 1440px
- **Large Desktop:** > 1440px

### Mobile-First Approach
All styles are mobile-first and progressively enhanced for larger screens.

### Sidebar Navigation
- Fixed sidebar on desktop
- Hamburger menu on mobile
- Smooth transitions
- Professional styling

### Dashboard Layout
- Responsive grid layouts
- Auto-adjusting columns
- Mobile-optimized views
- Touch-friendly spacing

---

## ♿ Accessibility Features

### Focus States
All interactive elements have visible focus states:
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Color Contrast
- WCAG AA compliant contrast ratios
- No color-only information
- Meaningful alt text support

### Motion Preferences
Respects `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}
```

### Semantic HTML Support
- Proper heading hierarchy
- Form labels and error messages
- ARIA-friendly styling
- Skip to main content link

---

## 🎯 Page-Specific Styles

### Dashboard (`dashboard-shell`)
- Stat cards grid
- Orders table
- Quick actions panel
- Recent activity list

### Payment Pages (`payment-page`)
- Checkout layout
- Payment method selection
- Summary cards
- Invoice styling

### Authentication (`auth-card`)
- Login/Signup forms
- Error handling
- Success states

### Landing Page
- Hero section
- Feature blocks
- Testimonials
- Call-to-action buttons

### Notifications
- Toast notifications
- Notification center
- Badge counts
- Unread states

---

## 🛠️ Utility Classes

### Spacing
```html
<div class="m-2 p-3 px-4 py-1">Content</div>
```

### Display
```html
<div class="flex flex-col gap-2">Column layout</div>
<div class="flex flex-between">Space between</div>
<div class="grid grid-cols-3 gap-2">Grid</div>
```

### Text
```html
<p class="text-center text-lg font-bold text-primary">Heading</p>
<p class="text-sm text-gray uppercase">Label</p>
```

### Colors
```html
<div class="bg-primary">Primary background</div>
<p class="text-success">Success text</p>
```

### Borders & Shadows
```html
<div class="border rounded-lg shadow-md">Card</div>
```

### Responsive
```html
<div class="hidden md-visible">Desktop only</div>
<div class="sm-grid-cols-1 md-grid-cols-2">Responsive grid</div>
```

---

## 📊 Loading States

### Skeleton Loaders
```html
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-input"></div>
<div class="skeleton skeleton-circle"></div>
```

### Spinners
```html
<div class="loader"></div>
<div class="loader sm"></div>
<div class="loader lg"></div>
```

### Button Loading
```html
<button class="button btn-loading">Loading...</button>
```

---

## 🌙 Dark Mode

Dark mode is supported via CSS custom properties:
```css
@media (prefers-color-scheme: dark) {
  /* Dark mode colors are automatically applied */
}
```

---

## 📖 Best Practices

1. **Use CSS Variables** - Leverage custom properties for consistency
2. **Mobile First** - Design for mobile, enhance for larger screens
3. **Semantic HTML** - Use proper HTML elements for better accessibility
4. **Utility Classes** - Use utility classes for quick styling
5. **Component Classes** - Use component classes for complex layouts
6. **Responsive Images** - Always use responsive images with proper alt text
7. **Focus States** - Always ensure visible focus states for keyboard navigation
8. **Animations** - Use animations sparingly and respect motion preferences

---

## 🔧 Customization

### Changing Colors
Update CSS variables in `:root`:
```css
:root {
  --color-primary: #your-color;
}
```

### Adding Custom Fonts
Update the font-family variable:
```css
:root {
  --font-family-primary: 'Your Font', sans-serif;
}
```

### Adjusting Spacing
Modify spacing variables:
```css
:root {
  --spacing-md: 1.2rem;
}
```

---

## 📝 License
All styling follows modern web standards and best practices.

---

**Last Updated:** May 16, 2026
**Version:** 2.0 (Enhanced Professional Styling)
