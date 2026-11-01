# Remotion Video Generation Prompts for InventoryCTRL

## Overview
These prompts are designed for creating promotional videos using Remotion that showcase InventoryCTRL's key features and workflows. Each prompt reflects the actual project UI, components, and business logic.

---

## Video 1: Hero/Landing Page Video (30 seconds)
**Purpose**: Quick overview for landing page hero section
**Target**: First-time visitors, decision makers

### Scene Breakdown:

**Scene 1 (0-5s): Problem Statement**
- Visual: Split screen showing frustrated warehouse manager with spreadsheets vs. messy paper logs.
- Text overlay: "Still tracking inventory with spreadsheets?"
- Animation: Fade in from black, subtle shake effect on spreadsheet.
- Audio: Ambient warehouse sounds.

**Scene 2 (5-10s): Solution Introduction**
- Visual: InventoryCTRL dashboard interface fading in. Show the Stats Cards: "Total Items", "Low Stock", "Out of Stock", "Total Value".
- Text overlay: "InventoryCTRL - Project-Based Inventory Management"
- Logo animation: Smooth scale and fade.
- Color scheme: Slate-900 background with Blue-500 accents (Industrial look).

**Scene 3 (10-20s): Key Features Carousel**
- Visual: Quick cuts showing:
  - **Scanner**: Toggling between "Checkout" and "Return" modes (2s).
  - **Dashboard**: Switching between "Table" and "Grid" view modes (2s).
  - **ABC Badges**: Close-up of A (Red), B (Amber), C (Green) classification badges (2s).
  - **Excel Export**: Clicking the "Download" icon and showing a file download animation (4s).
- Text overlays: "Mobile Scanning", "Flexible Views", "Smart ABC Classification", "Instant Reporting".
- Animation: Smooth transitions with subtle zoom on UI components.

**Scene 4 (20-25s): Value Proposition**
- Visual: Split screen showing before/after metrics.
- Text: "Know exactly what materials went to which project."
- Numbers animating: "14-day free trial • Starting at $59.99/mo"

**Scene 5 (25-30s): Call to Action**
- Visual: "Start Your Free Trial Today" button with a pulse effect.
- URL: "ictrl.app"
- Animation: Final fade to logo.

---

## Video 2: Scanner Workflow Demo (45 seconds)
**Purpose**: Showcase the core scanning functionality (Checkout & Return)
**Target**: Warehouse staff, operations managers

### Scene Breakdown:

**Scene 1 (0-5s): Setup**
- Visual: User selecting "Scanner" from the sidebar.
- Text overlay: "Checkout materials in seconds."
- UI: Show the Scanner page with the "Checkout" mode active by default.

**Scene 2 (5-15s): Checkout Mode & Project Selection**
- Visual: Screen recording of Scanner page.
  - User selecting a "Project" from the mandatory dropdown (e.g., "Project Alpha").
  - Camera/Scanner interface activating.
- Annotations: Highlight that Project selection is required for checkout.
- Text: "1. Select Project and Scan."

**Scene 3 (15-25s): Scanning Action**
- Visual: Split screen.
  - Left: Physical QR code being scanned.
  - Right: App interface showing "Scanned Items List" building up.
- Animation: Success beep (Green pulse) when an item is recognized.
- Show quantity adjustment: Clicking "+" to increase quantity of a scanned item.
- Text: "2. Scan items or adjust quantities manually."

**Scene 4 (25-35s): Batch Confirmation**
- Visual: "Confirm Checkout" button being pressed.
- Animation: Loading spinner transitioning to a "Checkout Successful" toast notification.
- Text: "3. Confirm and sync to inventory."

**Scene 5 (35-45s): Return Mode Preview**
- Visual: Toggle switching from "Checkout" to "Return".
- Show scanning an item to return and selecting the original project for allocation.
- Text: "Accurate returns tracked by project."
- Fade to logo.

---

## Video 3: Dashboard & Reporting (60 seconds)
**Purpose**: Highlight inventory visibility, fuzzy search, and ABC classification
**Target**: Operations managers, business owners

### Scene Breakdown:

**Scene 1 (0-10s): Dashboard Overview**
- Visual: Full dashboard view. Zoom into the Stats Cards showing real-time inventory value.
- Text: "Complete inventory visibility at a glance."
- Highlight: ABC classification badges (A/B/C) in the inventory table.

**Scene 2 (10-22s): Fuzzy Search & Advanced Filtering**
- Visual: User typing "cable" in the search bar. Show items filtering in real-time (fuzzy matching across item code, description, category).
- Demonstrate Filters:
  - Selecting "Category: Electrical".
  - Selecting "ABC: A (High Value)".
  - Selecting "Stock: Low Stock".
- Text: "Powerful fuzzy search and smart filters."

**Scene 3 (22-35s): View Modes & ABC Intelligence**
- Visual: Switching from "Table" to "Grid" view. Items appear as cards with prominent ABC badges.
- Explain ABC: "A items (30% value), B (20%), C (10%) - focused control."
- Text: "Focus on your most critical items."

**Scene 4 (35-48s): QR Code Generation**
- Visual: Bulk selection mode. User selecting multiple items using checkboxes.
- Click "Generate QR Codes" → Dialog opens with multiple QR codes and "Print" button.
- Text: "Bulk QR generation for your entire warehouse."

**Scene 5 (48-60s): Excel Export**
- Visual: Clicking "Export to Excel" in the Dashboard.
- Transition to the **Manage** page → Select a Project → Click "Export Project Items".
- Text: "Detailed reports for billing and audits."
- CTA: "Start your free trial."

---

## Video 4: Multi-Tenant & Team Management (40 seconds)
**Purpose**: Showcase collaboration and role-based access
**Target**: Business owners, IT managers

### Scene Breakdown:

**Scene 1 (0-10s): Role-Based Access Control**
- Visual: User Management interface showing the four roles:
  - **Master Admin** (Owner)
  - **Admin** (Full access)
  - **User** (Checkout/Scanner access)
  - **Read Only** (View only)
- Animation: Tooltips appearing for each role explaining permissions.
- Text: "Secure roles for every team member."

**Scene 2 (10-25s): Invitation Flow**
- Visual: Admin clicking "Invite User" → Entering email and selecting "User" role.
- Animation: Success toast "Invitation Sent".
- Show "Pending Invitations" list with the new entry.
- Text: "Invite your team in seconds."

**Scene 3 (25-40s): Data Isolation & Security**
- Visual: Abstract visualization showing organization-level data isolation.
- Usage indicators: Show "Users: 3/5" and "Items: 145/200" reflecting plan limits.
- Text: "Enterprise-grade security and data isolation."
- Fade to pricing.

---

## Video 5: Subscription & Billing (35 seconds)
**Purpose**: Explain pricing plans and trial
**Target**: Decision makers

### Scene Breakdown:

**Scene 1 (0-10s): 14-Day Free Trial**
- Visual: "14 Days Free" badge with a shine effect over the sign-up page.
- Text: "Full access. No credit card required."

**Scene 2 (10-25s): Plan Comparison**
- Visual: Three plan cards sliding in (Reflecting `planCatalog.ts`):
  - **Starter**: $59.99/mo - 5 users, 200 items.
  - **Business**: $99.99/mo - 25 users, 700 items (Highlight: "Most Popular").
  - **Enterprise**: $149.99/mo - Unlimited users and items.
- Highlight: "All plans include Unlimited Transactions."

**Scene 3 (25-35s): Easy Management**
- Visual: Billing page showing active subscription and usage progress bars.
- Text: "Plans that grow with your business."
- CTA: "Start Your Free Trial."

---

## Video 6: Manage Page & Organization (45 seconds)
**Purpose**: Show how to organize items, projects, and vendors
**Target**: Operations managers

### Scene Breakdown:

**Scene 1 (0-15s): Item Management**
- Visual: **Manage** page with the "Items" tab active.
- Show "Add Item" dialog: Filling in "Item Code", "ABC Classification", "Unit Value", and "Category".
- Text: "Comprehensive item tracking."

**Scene 2 (15-30s): Projects & Vendors**
- Visual: Switching to "Projects" tab. Show "Active" vs "Inactive" project toggles.
- Switching to "Vendors" tab. Show vendor list.
- Text: "Organize by project, category, and vendor."

**Scene 3 (30-45s): Item Reconciliation**
- Visual: Admin clicking "Restock" on an item. Entering quantity and seeing the "Input Log" update.
- Text: "Simple restocking and reconciliation."
- Fade to logo.

---

## Technical Specifications for Remotion Implementation

### General Settings:
```typescript
{
  fps: 30,
  width: 1920,
  height: 1080,
  backgroundColor: '#0f172a', // Slate 900
}
```

### Color Palette (Matching Tailwind/Shadcn):
- **Background**: `#0f172a` (Slate 900)
- **Primary**: `#3b82f6` (Blue 500)
- **Secondary**: `#1e293b` (Slate 800)
- **A (High Value)**: `#ef4444` (Red 500)
- **B (Medium Value)**: `#f59e0b` (Amber 500)
- **C (Low Value)**: `#10b981` (Emerald 500)
- **Text**: `#f8fafc` (Slate 50)

### Typography:
- Headings: Inter Bold (Standard in the app)
- Body: Inter Regular
- Icons: Lucide-react (Use the same icons as the app: Package, Search, QrCode, etc.)

### Animation Principles:
- **Eases**: Use `spring` for UI elements (buttons, cards) to match the "bouncy" feel of Radix/Shadcn components.
- **Timing**: 300ms for transitions, 500ms for major layout shifts.
- **Feedback**: Use the actual app's success/error beep sounds in the Scanner video.

---

## Implementation Notes

1.  **UI Consistency**: Ensure the "Glassmorphism" effect of the `glass-card` class is replicated in Remotion.
2.  **Data Integrity**: Use the item names and categories found in the app's default state (e.g., Category: "General", ABC curve: "C").
3.  **Roles**: Ensure the distinction between "Master Admin" and "Admin" is clear in the Team Management video.
4.  **Responsive**: The Scanner video should emphasize mobile-friendliness.
