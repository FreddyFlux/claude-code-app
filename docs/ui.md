# UI Coding Standards

This document outlines the strict UI coding standards for this Next.js project. All developers must adhere to these guidelines.

## Component Library

### shadcn/ui - MANDATORY

**CRITICAL RULE: ONLY shadcn/ui components are permitted in this project.**

- ✅ **DO**: Use shadcn/ui components exclusively for all UI elements
- ❌ **DO NOT**: Create custom components from scratch
- ❌ **DO NOT**: Use any other component libraries (MUI, Ant Design, Chakra, etc.)
- ❌ **DO NOT**: Build custom buttons, inputs, dialogs, or any other UI primitives

### Installing shadcn/ui Components

To add a new shadcn/ui component to the project:

```bash
npx shadcn@latest add [component-name]
```

Examples:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add table
```

### Available shadcn/ui Components

Refer to the official [shadcn/ui documentation](https://ui.shadcn.com/docs/components) for the complete list of available components. Commonly used components include:

- **Layout**: Card, Separator, Tabs, Accordion
- **Forms**: Button, Input, Textarea, Select, Checkbox, Radio Group, Switch, Label, Form
- **Data Display**: Table, Badge, Avatar, Calendar, Chart
- **Feedback**: Alert, Toast, Dialog, Alert Dialog, Sheet
- **Navigation**: Dropdown Menu, Navigation Menu, Breadcrumb, Pagination
- **Overlay**: Popover, Tooltip, HoverCard, Context Menu

### Component Composition

While you cannot create custom UI primitives, you CAN and SHOULD:

- ✅ Compose shadcn/ui components together to create page layouts
- ✅ Combine multiple shadcn/ui components to achieve complex UIs
- ✅ Use Tailwind CSS classes to style and position shadcn/ui components
- ✅ Wrap shadcn/ui components in semantic containers (divs, sections, etc.)

**Example - CORRECT**:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UserProfile() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p>User details go here</p>
        <Button className="mt-4">Edit Profile</Button>
      </CardContent>
    </Card>
  );
}
```

**Example - INCORRECT**:
```tsx
// ❌ DO NOT DO THIS - Custom button component
export function CustomButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-4 py-2 bg-blue-500 rounded">
      {children}
    </button>
  );
}
```

## Date Formatting

### date-fns - MANDATORY

**CRITICAL RULE: All date formatting must be done using the date-fns library.**

- ✅ **DO**: Use date-fns for all date formatting operations
- ❌ **DO NOT**: Use native JavaScript date methods (`.toLocaleDateString()`, etc.)
- ❌ **DO NOT**: Use other date libraries (moment.js, dayjs, luxon, etc.)
- ❌ **DO NOT**: Manually format dates with string concatenation

### Installation

```bash
npm install date-fns
```

### Standard Date Format

All dates displayed in the UI must follow this format:

**Format**: `do MMM yyyy`

**Examples**:
- 1st Sep 2025
- 2nd Aug 2025
- 3rd Jan 2026
- 4th Jun 2024

### Implementation

```tsx
import { format } from "date-fns";

// Format a date
const formattedDate = format(new Date(), "do MMM yyyy");
// Output: "31st Oct 2025"

// In a component
export default function EventCard() {
  const eventDate = new Date("2025-09-01");

  return (
    <Card>
      <CardContent>
        <p>Event Date: {format(eventDate, "do MMM yyyy")}</p>
      </CardContent>
    </Card>
  );
}
```

### Date Format Reference

The format string `"do MMM yyyy"` breaks down as:
- `do` - Day of month with ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
- `MMM` - Abbreviated month name (Jan, Feb, Mar, etc.)
- `yyyy` - Full year (2025, 2026, etc.)

### Additional date-fns Usage

While the standard format is `"do MMM yyyy"`, you may use other date-fns functions for:
- Date arithmetic: `addDays()`, `subMonths()`, `differenceInDays()`
- Date comparison: `isBefore()`, `isAfter()`, `isEqual()`
- Date parsing: `parseISO()`, `parse()`
- Relative formatting: `formatDistance()`, `formatRelative()`

However, when **displaying** dates in the UI, always use `format(date, "do MMM yyyy")`.

## Styling

### Tailwind CSS

- Use Tailwind CSS utility classes for styling shadcn/ui components
- Follow the existing color scheme defined in `app/globals.css`
- Maintain consistency with the zinc color palette
- Respect dark mode support using CSS variables

### Typography

- Use the Geist Sans font (already configured globally)
- Use Geist Mono for code snippets
- Maintain consistent font sizes and weights across the application

## Enforcement

These standards are **non-negotiable**. All pull requests must comply with these rules:

1. **shadcn/ui components only** - No custom UI primitives
2. **date-fns for dates** - No other date formatting methods
3. **Standard date format** - `do MMM yyyy` for all displayed dates

Any code that violates these standards will be rejected during code review.

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [date-fns Documentation](https://date-fns.org/)
- [date-fns Format Reference](https://date-fns.org/docs/format)
