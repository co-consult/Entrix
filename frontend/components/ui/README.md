# UI Components – Modal & Dialog Design System

## Overview
This directory contains reusable UI components for the Entrix frontend, including the core modal/dialog primitives used throughout the application.

## Modal/Dialog System

All modals and dialogs in the project are built using the `Dialog` and `AlertDialog` primitives, based on [Radix UI](https://www.radix-ui.com/primitives/docs/components/dialog). These provide accessible, consistent, and customizable modal experiences for admin, organizer, and user-facing flows.

### Key Components
- **Dialog**: For general-purpose modals (forms, details, creation flows, etc.)
- **AlertDialog**: For confirmation, warnings, or destructive actions

### Usage Pattern
- Import from `@/components/ui/dialog` or `@/components/ui/alert-dialog`
- Compose with `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, and `DialogClose` as needed
- Use icons, section headers, helper texts, and grid layouts for clarity and modern design
- Ensure all modals are accessible (focus trap, keyboard navigation, ARIA labels)

### Design Guidelines
- **Consistent Layout**: Use a card-like structure with clear section headers and spacing
- **Icons**: Add relevant icons to headers and sections for visual context
- **Helper Texts**: Provide descriptions and helper texts for all fields and actions
- **Grid Layouts**: Use grid or flex layouts for forms and data presentation
- **Validation**: Implement real-time validation and clear error messages
- **Accessibility**: Ensure all modals are keyboard navigable and screen reader friendly
- **Responsiveness**: Modals should be usable on all screen sizes

### Examples
See `SubscriptionCreateModal.tsx`, `UserSearchModal.tsx`, and admin/organizer modals for best practices.

### Extending/Creating New Modals
- Always use the shared primitives from this directory
- Follow the design guidelines above
- Test for accessibility and responsiveness

---

For questions or to propose improvements, contact the frontend maintainers or open a PR with your suggested changes. 