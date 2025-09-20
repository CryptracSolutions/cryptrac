# Button Component Documentation

## Overview
The Button component system has been rebuilt to achieve 100% visual and experiential parity with Stripe's button design patterns while maintaining Cryptrac's brand identity.

## Components

### Button
The primary button component with full variant and state support.

```tsx
import { Button } from '@/app/components/ui/button'

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Button</Button>

// With sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (Default)</Button>
<Button size="lg">Large</Button>

// With icons
<Button leftIcon={<Plus size={16} />}>Add Item</Button>
<Button rightIcon={<ArrowRight size={16} />}>Continue</Button>

// Loading state
<Button loading>Processing...</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### ButtonGroup
Groups multiple buttons with proper spacing or visual connection.

```tsx
import { ButtonGroup } from '@/app/components/ui/button-group'

// Basic group
<ButtonGroup>
  <Button>Save</Button>
  <Button variant="ghost">Cancel</Button>
</ButtonGroup>

// Connected buttons
<ButtonGroup connected>
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>

// Vertical orientation
<ButtonGroup orientation="vertical">
  <Button>Top</Button>
  <Button>Bottom</Button>
</ButtonGroup>
```

### IconButton
Specialized square button for icon-only actions.

```tsx
import { IconButton } from '@/app/components/ui/icon-button'
import { Settings, X, Menu } from 'lucide-react'

// Basic icon button
<IconButton icon={<Settings />} aria-label="Settings" />

// With variants
<IconButton icon={<X />} aria-label="Close" variant="ghost" />
<IconButton icon={<Menu />} aria-label="Menu" variant="secondary" />

// Different sizes
<IconButton icon={<Settings />} aria-label="Settings" size="xs" />
<IconButton icon={<Settings />} aria-label="Settings" size="lg" />
```

## Variants

### Primary
- **Use for**: Primary actions, CTAs, form submissions
- **Color**: Cryptrac brand purple (#7f5efd)
- **Example**: "Create Payment", "Save Changes", "Continue"

### Secondary (Default)
- **Use for**: Secondary actions, default buttons
- **Color**: White background with border
- **Example**: "Cancel", "Back", "View Details"

### Destructive
- **Use for**: Dangerous or irreversible actions
- **Color**: Error red (#E35C5C)
- **Example**: "Delete", "Remove", "Disconnect"

### Ghost
- **Use for**: Tertiary actions, minimal visual weight
- **Color**: Transparent, subtle hover
- **Example**: Icon buttons, "Learn more", toolbar actions

### Link
- **Use for**: Navigation, inline actions
- **Color**: Brand purple text, underline on hover
- **Example**: "View documentation", "Terms of service"

## Sizes

| Size | Height | Font Size | Use Case |
|------|--------|-----------|----------|
| `xs` | 24px | 11px | Compact UI, tables |
| `sm` | 28px | 12px | Dense interfaces |
| `md` | 32px | 14px | Default, most uses |
| `lg` | 40px | 16px | Primary CTAs, mobile |

## States

### Hover
- Smooth color transition (200ms ease)
- Slight background shift
- Maintains readability

### Active/Pressed
- Scale transform (0.98)
- Quick feedback (150ms)
- Indicates interaction

### Focus
- 2px focus ring with 2px offset
- Uses brand color
- Keyboard navigation support

### Disabled
- 50% opacity
- No pointer events
- Cursor: not-allowed

### Loading
- Animated spinner icon
- Disables interaction
- Maintains button size

## Best Practices

### Do's
- Use primary variant for the main action on a page
- Provide clear, action-oriented labels
- Include aria-label for icon-only buttons
- Group related actions with ButtonGroup
- Use consistent sizing within a section

### Don'ts
- Don't use more than one primary button per section
- Avoid using destructive variant without confirmation
- Don't disable buttons without clear reasoning
- Avoid mixing button sizes in the same group
- Don't use link variant for actions (use for navigation)

## Accessibility

All button components include:
- Keyboard navigation support (Tab, Enter, Space)
- Focus indicators for keyboard users
- ARIA attributes (aria-label, aria-busy for loading)
- Proper contrast ratios (WCAG AA compliant)
- Screen reader announcements for state changes

## Migration Guide

### From Old Button
```tsx
// Old
<Button variant="default">Click</Button>
<Button variant="outline">Click</Button>
<Button size="default">Click</Button>

// New
<Button variant="primary">Click</Button>
<Button variant="secondary">Click</Button>
<Button size="md">Click</Button>
```

### Key Changes
1. `variant="default"` → `variant="primary"`
2. `variant="outline"` → `variant="secondary"`
3. `size="default"` → `size="md"`
4. New props: `loading`, `leftIcon`, `rightIcon`, `fullWidth`
5. Improved focus states and transitions

## Examples

### Form Actions
```tsx
<div className="flex gap-3">
  <Button variant="primary" type="submit">
    Save Changes
  </Button>
  <Button variant="ghost" type="button">
    Cancel
  </Button>
</div>
```

### Confirmation Dialog
```tsx
<div className="flex gap-3">
  <Button variant="destructive" onClick={handleDelete}>
    Delete Account
  </Button>
  <Button variant="secondary" onClick={closeDialog}>
    Keep Account
  </Button>
</div>
```

### Table Actions
```tsx
<ButtonGroup connected>
  <IconButton icon={<Edit />} aria-label="Edit" size="sm" />
  <IconButton icon={<Copy />} aria-label="Duplicate" size="sm" />
  <IconButton icon={<Trash />} aria-label="Delete" size="sm" variant="destructive" />
</ButtonGroup>
```

## Performance

- Buttons use CSS-in-JS with minimal runtime overhead
- Transitions use GPU-accelerated properties (transform, opacity)
- Icons are optimized with proper sizing constraints
- Loading states don't cause layout shifts