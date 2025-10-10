# RevaDates - Visual Design Guide

## 🎨 Complete Color System

### Primary Gradients

```css
/* Purple-Pink Gradient (Primary Brand) */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Use for: Primary buttons, hero sections, brand elements */

/* Pink-Red Gradient (Accent) */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
/* Use for: Call-to-action, highlights, notifications */

/* Blue-Purple Gradient (Secondary) */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
/* Use for: Secondary actions, info states */

/* Green-Emerald (Success) */
background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
/* Use for: Like buttons, success messages, confirmations */

/* Red-Pink (Danger/Pass) */
background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
/* Use for: Delete, pass buttons, error states */

/* Yellow-Orange (Warning/Undo) */
background: linear-gradient(135deg, #f2994a 0%, #f2c94c 100%);
/* Use for: Undo, warning messages, attention */
```

### Tailwind Class Versions

```tsx
/* Backgrounds */
bg-gradient-to-r from-purple-500 to-pink-500
bg-gradient-to-r from-pink-500 to-red-500
bg-gradient-to-r from-blue-500 to-purple-500
bg-gradient-to-r from-green-400 to-emerald-500
bg-gradient-to-r from-red-400 to-pink-500
bg-gradient-to-r from-yellow-400 to-orange-500

/* Text Gradients */
bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent
bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent
```

### Background Colors (Dark Theme)

```css
/* Primary Background */
--bg-primary: #0a0a0a;    /* #0a0a0a - Main app background */
background-color: #0a0a0a;

/* Secondary/Elevated */
--bg-secondary: #141414;   /* #141414 - Cards, elevated surfaces */
background-color: #141414;

/* Tertiary/Hover */
--bg-tertiary: #1e1e1e;    /* #1e1e1e - Hover states */
background-color: #1e1e1e;

/* Glassmorphism Layers */
background-color: rgba(255, 255, 255, 0.05);  /* bg-white/5 */
background-color: rgba(255, 255, 255, 0.10);  /* bg-white/10 */
background-color: rgba(255, 255, 255, 0.15);  /* bg-white/15 */
```

### Text Colors

```css
/* Primary Text */
color: #ffffff;           /* text-white - Headings, important text */

/* Secondary Text */
color: #a0a0a0;           /* text-white/60 - Body text, descriptions */

/* Tertiary Text */
color: #6b6b6b;           /* text-white/40 - Captions, hints */

/* Muted Text */
color: rgba(255, 255, 255, 0.3);  /* text-white/30 - Disabled text */
```

---

## 📐 Spacing System

Based on 8px grid:

```css
4px   = 0.25rem = space-1
8px   = 0.5rem  = space-2  /* Tight spacing */
12px  = 0.75rem = space-3
16px  = 1rem    = space-4  /* Default spacing */
24px  = 1.5rem  = space-6  /* Comfortable spacing */
32px  = 2rem    = space-8  /* Section spacing */
48px  = 3rem    = space-12 /* Large gaps */
64px  = 4rem    = space-16 /* Hero spacing */
96px  = 6rem    = space-24 /* Extra large gaps */
```

### Common Spacing Patterns

```tsx
/* Card Padding */
className="p-6"           // 24px - Default card padding
className="p-8"           // 32px - Large card padding

/* Section Gaps */
className="space-y-6"     // 24px vertical gap between items
className="gap-4"         // 16px gap in flex/grid

/* Component Margins */
className="mb-4"          // 16px bottom margin
className="mt-8"          // 32px top margin for sections
```

---

## 🔤 Typography System

### Font Sizes & Weights

```tsx
/* Display (Hero Text) */
<h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
  Display Text
</h1>

/* Heading 1 */
<h1 className="text-4xl font-bold tracking-tight">
  Main Heading
</h1>

/* Heading 2 */
<h2 className="text-3xl font-bold">
  Section Heading
</h2>

/* Heading 3 */
<h3 className="text-2xl font-semibold">
  Subsection
</h3>

/* Body Large */
<p className="text-lg leading-relaxed">
  Important body text
</p>

/* Body */
<p className="text-base leading-normal">
  Regular body text
</p>

/* Caption */
<span className="text-sm text-white/60">
  Supporting text
</span>

/* Small */
<span className="text-xs text-white/40">
  Fine print
</span>
```

---

## 🎯 Component Patterns

### 1. Modern Button Variants

```tsx
/* Primary Action Button */
<Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 border-none">
  Primary Action
</Button>

/* Secondary Button */
<Button className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-full border border-white/20 hover:border-white/30 backdrop-blur-md transition-all duration-300 hover:scale-105">
  Secondary Action
</Button>

/* Success Button */
<Button className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg shadow-green-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
  Like
</Button>

/* Danger Button */
<Button className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg shadow-red-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105">
  Pass
</Button>

/* Icon Button */
<Button className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300">
  <Icon className="h-6 w-6" />
</Button>

/* Floating Action Button */
<Button className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-110 transition-all duration-300 fixed bottom-24 right-6">
  <Plus className="h-8 w-8 text-white" />
</Button>
```

### 2. Card Styles

```tsx
/* Basic Glass Card */
<div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
  Content
</div>

/* Elevated Glass Card */
<div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
  Content
</div>

/* Gradient Border Card */
<div className="relative p-6 rounded-2xl bg-black">
  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl p-[1px] -z-10">
    <div className="bg-black rounded-2xl h-full w-full"></div>
  </div>
  Content
</div>

/* Hover Card */
<div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
  Hoverable Content
</div>

/* Profile/Swipe Card */
<div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20"></div>
  <img src="..." className="w-full h-full object-cover" />
  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 backdrop-blur-md">
    Profile Info
  </div>
</div>
```

### 3. Input Fields

```tsx
/* Modern Text Input */
<Input className="h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:bg-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300" />

/* Search Input with Icon */
<div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
  <Input className="h-12 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:bg-white/10 focus:border-purple-500/50 transition-all" />
</div>

/* Textarea */
<textarea className="w-full min-h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none" />
```

### 4. Badges & Tags

```tsx
/* Notification Badge */
<span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-500/50 animate-pulse">
  3
</span>

/* Status Badge */
<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-sm font-medium">
  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
  Online
</span>

/* Tag */
<span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm">
  Interest
</span>

/* Gradient Tag */
<span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm backdrop-blur-sm">
  Premium
</span>
```

### 5. Avatars

```tsx
/* Basic Avatar */
<Avatar className="h-12 w-12 ring-2 ring-white/10">
  <AvatarImage src={photo} />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

/* Avatar with Gradient Ring */
<div className="p-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
  <Avatar className="h-16 w-16 border-2 border-black">
    <AvatarImage src={photo} />
    <AvatarFallback>JD</AvatarFallback>
  </Avatar>
</div>

/* Avatar with Online Indicator */
<div className="relative">
  <Avatar className="h-12 w-12">
    <AvatarImage src={photo} />
  </Avatar>
  <span className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full ring-2 ring-black"></span>
</div>
```

### 6. Modals & Dialogs

```tsx
/* Modern Alert Dialog */
<AlertDialogContent className="w-full max-w-md rounded-3xl p-8 bg-black/95 backdrop-blur-2xl border border-white/20 shadow-2xl">
  <AlertDialogHeader className="text-center">
    <div className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 w-fit">
      <Icon className="h-8 w-8 text-purple-400" />
    </div>
    <AlertDialogTitle className="text-2xl font-bold text-white">
      Dialog Title
    </AlertDialogTitle>
    <AlertDialogDescription className="text-base text-white/70 mt-2">
      Description text goes here
    </AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter className="flex-row gap-3 mt-6">
    <AlertDialogCancel className="flex-1 bg-white/10 hover:bg-white/20 border-white/20 rounded-full">
      Cancel
    </AlertDialogCancel>
    <AlertDialogAction className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full shadow-lg">
      Confirm
    </AlertDialogAction>
  </AlertDialogFooter>
</AlertDialogContent>
```

---

## 🌈 Shadow System

```css
/* Elevation Levels */

/* Level 1 - Subtle */
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
className="shadow-sm"

/* Level 2 - Default */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
className="shadow"

/* Level 3 - Medium */
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
className="shadow-lg"

/* Level 4 - Large */
box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
className="shadow-xl"

/* Level 5 - Extra Large */
box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
className="shadow-2xl"

/* Colored Glow Shadows */
box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
className="shadow-lg shadow-purple-500/50"

box-shadow: 0 0 20px rgba(236, 72, 153, 0.5);
className="shadow-lg shadow-pink-500/50"

box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
className="shadow-lg shadow-blue-500/50"
```

---

## 🎭 Animation Patterns

```tsx
/* Fade In */
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

/* Slide Up */
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

/* Scale In */
<motion.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>

/* Slide From Bottom (Modal) */
<motion.div
  initial={{ y: '100vh', opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: '100vh', opacity: 0 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
>
  Modal Content
</motion.div>

/* Button Hover */
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Button
</motion.button>

/* Pulse Animation */
<div className="animate-pulse">
  Content
</div>

/* Spin Animation */
<div className="animate-spin">
  <Loader />
</div>
```

---

## 📱 Responsive Breakpoints

```tsx
/* Mobile First Approach */

/* Extra Small (default) */
/* < 640px - Mobile phones */
<div className="text-base">Mobile</div>

/* Small */
/* >= 640px - Large phones */
<div className="sm:text-lg">Small</div>

/* Medium */
/* >= 768px - Tablets */
<div className="md:text-xl">Medium</div>

/* Large */
/* >= 1024px - Laptops */
<div className="lg:text-2xl">Large</div>

/* Extra Large */
/* >= 1280px - Desktops */
<div className="xl:text-3xl">Extra Large</div>

/* 2X Large */
/* >= 1536px - Large Desktops */
<div className="2xl:text-4xl">2X Large</div>
```

### Common Responsive Patterns

```tsx
/* Responsive Padding */
<div className="px-4 md:px-8 lg:px-12">Content</div>

/* Responsive Grid */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">Items</div>

/* Responsive Flex Direction */
<div className="flex flex-col md:flex-row gap-4">Items</div>

/* Responsive Text Size */
<h1 className="text-3xl md:text-4xl lg:text-5xl">Heading</h1>

/* Hide on Mobile */
<div className="hidden md:block">Desktop Only</div>

/* Show on Mobile Only */
<div className="block md:hidden">Mobile Only</div>
```

---

## 🎨 Design Principles Summary

### 1. **Consistent Gradients**
- Always use brand gradients (purple-pink) for primary actions
- Use semantic gradients (green for success, red for danger)
- Maintain 135deg angle for consistency

### 2. **Glassmorphism**
- Use `bg-white/5` to `bg-white/15` for transparency
- Always include `backdrop-blur-md` or stronger
- Add subtle borders with `border-white/10`

### 3. **Rounded Corners**
- Use `rounded-2xl` (16px) for cards
- Use `rounded-3xl` (24px) for large cards
- Use `rounded-full` for buttons and avatars

### 4. **Spacing**
- Follow 8px grid system
- Use `space-y-6` for vertical rhythm
- Maintain consistent padding (p-6 for cards)

### 5. **Shadows**
- Add colored shadows to gradient elements
- Use `shadow-2xl` for elevated elements
- Include glow effects on hover

### 6. **Typography**
- Keep hierarchy clear (4xl → 3xl → 2xl → base)
- Use gradient text for emphasis
- Maintain good contrast (white on dark)

### 7. **Animations**
- Keep transitions smooth (300ms duration)
- Use scale hover effects (1.05)
- Add easing for natural feel

### 8. **Accessibility**
- Ensure minimum 44x44px touch targets
- Maintain text contrast ratios
- Include focus states

---

## 🖼️ Visual Examples Summary

```
┌─────────────────────────────────────┐
│  ┌───┐  RevaDates                   │  ← Header with gradient logo
│  │💜│                         🔔 👤 │
│  └───┘                               │
├─────────────────────────────────────┤
│                                      │
│    ┌────────────────────────┐       │
│    │                        │       │
│    │   [Profile Photo]      │       │  ← Swipe card with
│    │                        │       │    gradient overlay
│    │   ╭──────────────╮     │       │
│    │   │ NAME, AGE    │     │       │
│    │   │ 📍 Location  │     │       │
│    │   ╰──────────────╯     │       │
│    └────────────────────────┘       │
│                                      │
│       ✕        ↶        ❤️          │  ← Gradient action buttons
│                                      │
├─────────────────────────────────────┤
│   🔥 Discover   💬 Chats   ⚙️ Settings │  ← Bottom nav with gradient
└─────────────────────────────────────┘
```

