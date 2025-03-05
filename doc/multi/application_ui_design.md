# Application Management UI Design

## Overview

The Application Management UI will be designed as a modern, visually appealing dashboard that provides at-a-glance information about each application. The design is inspired by financial/banking dashboards with card-based layouts, clear metrics, and intuitive navigation.

## Application List View

### Layout
- Grid layout with application cards (3-4 cards per row depending on screen size)
- Top section with header, search, and filter controls
- Each application represented as a card with consistent styling

### Application Card Design
Each application card will include:

1. **Header Section**
   - Application logo/icon (left)
   - Application name (prominent display)
   - Status indicator (right corner)

2. **Description Section**
   - Brief description of the application
   - Website URL (if available)
   - Version number

3. **Metrics Section**
   - Key statistics displayed as mini-cards or badges:
     - Organization count
     - User count
     - Chatflow count
     - Agentflow count
   - Visual indicators for metrics (icons, colors)

4. **Footer Section**
   - Created/Updated timestamps
   - Quick action buttons (View, Edit, Delete)

### Visual Style
- Clean, modern card design with subtle shadows
- Consistent color scheme matching the platform's theme
- Clear typography hierarchy
- Status indicators with appropriate colors (green for active, red for inactive, etc.)
- Hover effects for interactive elements

## Application Detail View

When an application is selected, the detail view will be structured as a comprehensive dashboard:

### Header
- Application logo and name
- Key action buttons (Edit, Delete, etc.)
- Status indicator
- Back button to return to list view

### Dashboard Sections

1. **Overview Panel**
   - Large metrics cards for key statistics
   - Usage charts (API calls, storage usage, etc.)
   - Activity timeline

2. **Organizations Panel**
   - List of organizations within this application
   - Quick stats for each organization
   - Add organization button

3. **Users Panel**
   - User count by role
   - Recent user activity
   - User management controls

4. **Resources Panel**
   - Counts and status of chatflows, agentflows, tools, etc.
   - Resource usage metrics
   - Quick links to resource management

5. **Settings Panel**
   - Application configuration options
   - Feature toggles
   - Resource limits management
   - API keys and credentials

### Charts and Visualizations
- Line charts for time-based metrics
- Bar charts for comparative data
- Pie/donut charts for distribution metrics
- Progress indicators for usage limits

## Application Creation/Edit Form

The form for creating or editing applications will include:

1. **Basic Information**
   - Name field
   - Description textarea
   - Website URL
   - Version number
   - Status selector

2. **Visual Identity**
   - Logo upload with preview
   - Color theme selection

3. **Resource Configuration**
   - Limit settings for various resources
   - Feature toggle switches
   - Model availability settings

4. **Organization Assignment**
   - Add/remove organizations
   - Set organization relationships

## Mobile Responsiveness

The UI will be fully responsive:
- Cards will stack vertically on smaller screens
- Metrics will adapt to available space
- Navigation will collapse into appropriate mobile patterns
- Touch-friendly controls for mobile users

## Implementation Notes

- Use existing card components (`ItemCard`, `StatsCard`) as a foundation
- Leverage Material-UI Grid system for responsive layouts
- Implement consistent loading states and transitions
- Ensure accessibility compliance throughout the interface
- Use the same styling patterns as the rest of the platform for consistency 