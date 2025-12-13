# KPI Dashboard Layout Reference

## Dashboard Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PROJECT AEGIS HEADER                             │
│  [Logo] Project Aegis         [Overview] [Map] [List]         [User]   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         PRIMARY KPI CARDS (Row 1)                       │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│  Total Incidents │ Critical & High  │ Active Responders│ Avg Response  │
│      [Icon]      │     [Icon]       │      [Icon]      │    [Icon]     │
│       XXX        │       XX         │        XX        │     XXm       │
│   ↑ +12% trend   │ X critical, X hi │  Field personnel │  First action │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       SECONDARY KPI CARDS (Row 2)                       │
├─────────┬─────────┬─────────┬─────────┬─────────────────────────────────┤
│Last Hour│ Last 7  │ Active  │Resolved │    Medium & Low                 │
│  [Icon] │ [Icon]  │ [Icon]  │ [Icon]  │       [Icon]                    │
│    X    │   XXX   │   XX    │   XX    │         XX                      │
│ Recent  │ Weekly  │ Pending │  X.X%   │    X med, X low                 │
└─────────┴─────────┴─────────┴─────────┴─────────────────────────────────┘

┌─────────────────────────────────┬───────────────────────────────────────┐
│    INCIDENT TYPES (Pie Chart)   │   SEVERITY LEVELS (Bar Chart)         │
│                                  │                                       │
│         ╭───────╮                │    ▂▃▅▆█                             │
│       ╱ Legend: ╲                │   │█ █ █ █│                          │
│      │  ⛰️ 40%  │               │   │█ █ █ █│                          │
│      │  🌊 30%  │               │   │█ █ █ █│                          │
│      │  🚧 20%  │               │   │█ █ █ █│                          │
│       ╲ ⚡ 10%  ╱                │   └─────────┘                         │
│         ╰───────╯                │    C  H  M  L                         │
└─────────────────────────────────┴───────────────────────────────────────┘

┌─────────────────────────────────┬───────────────────────────────────────┐
│  24-HOUR TREND (Area Chart)     │   7-DAY TREND (Line Chart)            │
│                                  │                                       │
│      ╱╲                         │         ╱╲                            │
│     ╱  ╲     ╱╲                 │        ╱  ╲    ╱╲                    │
│    ╱    ╲   ╱  ╲                │       ╱    ╲  ╱  ╲                   │
│   ╱      ╲ ╱    ╲               │      ╱      ╲╱    ╲                  │
│  ╱        ╲      ╲              │     ╱              ╲                  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓             │    ╱                ╲                 │
│ 0  4  8  12 16 20 24            │   Mon Tue Wed Thu Fri Sat Sun         │
└─────────────────────────────────┴───────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    INCIDENT TYPE SUMMARY CARDS                          │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│   ⛰️ Landslides  │   🌊 Floods      │   🚧 Road Blocks │ ⚡ Power Lines│
│       XX         │       XX         │        XX        │      XX       │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

## KPI Card Details

### Primary KPI Cards (Large, Gradient Backgrounds)

**Card 1: Total Incidents** (Blue gradient)
- Icon: AlertTriangle
- Value: Total count
- Subtitle: Count in last 24 hours
- Trend: % change vs previous 24h (with up/down arrow)

**Card 2: Critical & High** (Red gradient)
- Icon: AlertCircle
- Value: Sum of critical + high priority
- Subtitle: Breakdown (X critical, X high)
- Color: Red theme for urgency

**Card 3: Active Responders** (Green gradient)
- Icon: Users
- Value: Unique responder count
- Subtitle: "Field personnel reporting"
- Color: Green for positive/active

**Card 4: Avg Response Time** (Purple gradient)
- Icon: Timer
- Value: Average time (e.g., "15m")
- Subtitle: "From report to first action"
- Color: Purple for performance metric

### Secondary KPI Cards (Smaller, Compact)

**Card 5: Last Hour** (Orange)
- Icon: Clock
- Value: Incident count
- Subtitle: "Most recent activity"

**Card 6: Last 7 Days** (Slate)
- Icon: Activity
- Value: Weekly total
- Subtitle: "Weekly total"

**Card 7: Active** (Yellow)
- Icon: XCircle
- Value: Unresolved count
- Subtitle: "Pending resolution"

**Card 8: Resolved** (Green)
- Icon: CheckCircle
- Value: Resolved count
- Subtitle: "X.X% resolution rate"

**Card 9: Medium & Low** (Blue)
- Icon: Target
- Value: Sum of medium + low
- Subtitle: "X medium, X low"

## Chart Specifications

### Pie Chart (Incident Types)
- Size: 280px height
- Outer radius: 100px
- Labels: Name + count + percentage
- Colors:
  - Landslide: #b45309 (brown)
  - Flood: #0369a1 (blue)
  - Road Block: #dc2626 (red)
  - Power Line: #7c3aed (purple)

### Bar Chart (Severity Levels)
- Size: 280px height
- Bars: Rounded top corners (8px radius)
- X-axis: Severity names (Critical, High, Medium, Low)
- Colors:
  - Critical: #dc2626 (red)
  - High: #f97316 (orange)
  - Medium: #eab308 (yellow)
  - Low: #22c55e (green)

### Area Chart (24-Hour Trend)
- Size: 250px height
- Area fill: Blue gradient (30% opacity at top, 0% at bottom)
- Line: Solid blue (#3b82f6), 2px width
- X-axis: Hours (0:00 to 23:00), showing every 3rd hour
- Data points: Hourly incident counts

### Line Chart (7-Day Trend)
- Size: 250px height
- Line: Solid green (#10b981), 3px width
- Dots: 4px radius, 6px on hover
- X-axis: Day names (Mon, Tue, Wed, etc.)
- Data points: Daily incident totals

### Type Summary Cards
- 4 cards in a row
- Each has emoji icon + count
- Light colored backgrounds matching type:
  - Landslide: red-50 bg, red-200 border
  - Flood: blue-50 bg, blue-200 border
  - Road Block: orange-50 bg, orange-200 border
  - Power Line: purple-50 bg, purple-200 border

## Color Theme

### Backgrounds
- Main: #f8fafc (gray-50)
- Cards: #ffffff (white)
- Inputs: #f9fafb (gray-50)

### Borders
- Light: #e5e7eb (gray-200)
- Medium: #d1d5db (gray-300)

### Text
- Primary: #111827 (gray-900)
- Secondary: #6b7280 (gray-500)
- Tertiary: #9ca3af (gray-400)

### Accents
- Primary: #2563eb (blue-600)
- Success: #10b981 (green-500)
- Warning: #f59e0b (amber-500)
- Error: #ef4444 (red-500)

## Responsive Breakpoints

### Desktop (lg: 1024px+)
- Primary KPIs: 4 columns
- Secondary KPIs: 5 columns
- Charts: 2 columns
- Type Summary: 4 columns

### Tablet (md: 768px+)
- Primary KPIs: 2 columns
- Secondary KPIs: 3 columns
- Charts: 1 column (stacked)
- Type Summary: 2 columns

### Mobile (< 768px)
- All KPIs: 1 column (stacked)
- Charts: 1 column
- Type Summary: 1 column

## Interaction States

### Hover
- KPI Cards: Subtle shadow increase (shadow-sm → shadow-md)
- Charts: Highlight data point with larger dot
- Tooltips: White background, gray border, shadow

### Focus
- Inputs: Blue border (border-blue-500)
- Focus ring: 2px blue-200
- Outline: None (custom ring)

### Active
- Buttons: Slightly darker background
- Cards: No change (hover only)

## Performance Considerations

### Data Refresh
- Real-time updates via Socket.io
- Charts re-render on data change
- Efficient filtering (memo/useMemo recommended)

### Rendering
- Charts use ResponsiveContainer for automatic sizing
- Lazy load charts if page becomes too heavy
- Consider virtualization for incident lists

### Accessibility
- All icons have aria-labels
- Color contrast meets WCAG AA
- Keyboard navigation support
- Screen reader friendly

