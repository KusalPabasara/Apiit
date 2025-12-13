# Quick Start Guide - Modernized Dashboard

## 🚀 Running the Updated Dashboard

### Prerequisites
- Node.js 18+ installed
- npm 9+ installed

### Installation & Setup

```bash
# Navigate to dashboard directory
cd dashboard

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The dashboard will be available at: `http://localhost:5174`

### Login Credentials
```
Username: admin
Password: admin123
```

## 📊 Dashboard Features

### 1. Overview Tab (New!)
**What you'll see:**
- 9 KPI cards showing critical metrics
- 4 interactive charts (Pie, Bar, Area, Line)
- Incident type summary cards
- Real-time trend analysis

**How to use:**
- Default landing page after login
- Scroll to see all KPIs and charts
- Hover over charts for detailed tooltips
- View 24-hour and 7-day trends

### 2. Live Map Tab
**What you'll see:**
- Interactive map of Ratnapura District
- Incident markers with colored icons
- Real-time location updates

**How to use:**
- Click markers to see incident details
- Critical incidents have pulsing markers
- Use legend in bottom-left corner

### 3. Incident List Tab
**What you'll see:**
- Filterable list of all incidents
- Search functionality
- Type and severity filters

**How to use:**
- Search by description, responder, or type
- Filter by incident type
- Filter by severity level
- Click incidents to view on map

## 🎨 Theme Customization

The dashboard now uses a **light theme** by default.

### Color Scheme
- **Primary**: Blue (#2563eb)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)
- **Background**: Light gray (#f8fafc)
- **Cards**: White (#ffffff)

### Theme Configuration
Located in: `dashboard/tailwind.config.js`

```javascript
aegisDashboardLight: {
  "primary": "#2563eb",
  "base-100": "#f8fafc",
  // ... other colors
}
```

## 📈 Understanding the KPIs

### Primary KPIs (Top Row)
1. **Total Incidents**: Overall count with 24h trend
2. **Critical & High**: Urgent incidents needing immediate attention
3. **Active Responders**: Number of field personnel currently active
4. **Avg Response Time**: Performance metric from report to action

### Secondary KPIs (Second Row)
5. **Last Hour**: Most recent activity
6. **Last 7 Days**: Weekly total
7. **Active**: Pending resolution
8. **Resolved**: Completion rate
9. **Medium & Low**: Lower priority incidents

### Charts
1. **Pie Chart**: Shows distribution by incident type
2. **Bar Chart**: Shows severity level breakdown
3. **Area Chart**: 24-hour hourly trend
4. **Line Chart**: 7-day daily trend

## 🔄 Real-Time Updates

The dashboard automatically updates when:
- New incidents are reported
- Incident status changes
- New responders join

**Connection Status**: Check top-right corner
- 🟢 "Live" = Connected
- 🔴 "Offline" = Disconnected

## 🛠️ Development

### File Structure
```
dashboard/
├── src/
│   ├── components/
│   │   ├── KPIDashboard.jsx       ⭐ NEW - Main KPI component
│   │   ├── IncidentMap.jsx        ✏️ Updated for light theme
│   │   ├── IncidentList.jsx       ✏️ Updated for light theme
│   │   ├── StatsPanel.jsx         (Original, not used in new design)
│   │   └── ...
│   ├── pages/
│   │   ├── DashboardPage.jsx      ✏️ Updated with Overview tab
│   │   └── LoginPage.jsx          ✏️ Updated for light theme
│   ├── index.css                  ✏️ Light theme styles
│   └── ...
├── tailwind.config.js             ✏️ Added aegisDashboardLight theme
└── package.json
```

### Key Components

**KPIDashboard.jsx**
- Main analytics component
- Calculates all KPIs from incident data
- Renders charts using Recharts library

**DashboardPage.jsx**
- Main container with tab navigation
- Manages view state (overview/map/list)
- Handles real-time updates

### Customizing KPIs

To add/modify KPIs, edit: `dashboard/src/components/KPIDashboard.jsx`

```javascript
// Example: Add new KPI
<KPICard
  title="Your Metric"
  value={calculatedValue}
  subtitle="Description"
  icon={YourIcon}
  color="blue"
/>
```

### Customizing Charts

Charts use Recharts library. Edit the chart sections in `KPIDashboard.jsx`:

```javascript
<BarChart data={yourData}>
  <Bar dataKey="value" />
  // ... customize
</BarChart>
```

## 🐛 Troubleshooting

### Charts not showing?
- Check if incidents data is populated
- Verify Recharts is installed: `npm list recharts`
- Check browser console for errors

### Theme not applied?
- Verify `data-theme="aegisDashboardLight"` in components
- Clear browser cache
- Check tailwind.config.js for theme definition

### API connection issues?
- Ensure backend is running on port 3001
- Check API_BASE_URL in services/api.js
- Verify CORS settings

### Real-time updates not working?
- Check Socket.io connection in Network tab
- Verify backend Socket.io server is running
- Check connection status indicator

## 📦 Production Build

```bash
# Build for production
cd dashboard
npm run build

# Output will be in: dashboard/dist/
```

### Deployment
The built files can be:
- Served by Nginx (see nginx.conf)
- Deployed to static hosting (Netlify, Vercel)
- Integrated with existing infrastructure

## 🎯 Performance Tips

1. **Lazy load charts** if page becomes heavy
2. **Memoize calculations** in KPIDashboard
3. **Debounce search** in IncidentList
4. **Virtualize lists** if >100 incidents
5. **Optimize images** if many incident photos

## 📱 Mobile Testing

Test on mobile devices:
```bash
# Find your local IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Access from mobile on same network
http://YOUR_IP:5174
```

## 🔐 Security Notes

**For production:**
- Change default admin credentials
- Implement proper JWT token validation
- Add rate limiting
- Enable HTTPS
- Sanitize incident inputs
- Add CSRF protection

## 📚 Documentation Files

Created documentation:
1. `DASHBOARD_MODERNIZATION.md` - Complete change summary
2. `KPI_DASHBOARD_REFERENCE.md` - Visual layout guide
3. `BEFORE_AFTER_COMPARISON.md` - Transformation overview
4. This file - Quick start guide

## 🆘 Support

**Common Issues:**
- Port 5174 already in use → Change in vite.config.js
- Dependencies missing → Run `npm install`
- Build errors → Clear node_modules, reinstall

**Need Help?**
- Check documentation files above
- Review component comments
- Check browser console for errors
- Verify backend API is running

## ✅ Verification Checklist

After starting the dashboard:
- [ ] Login page loads with light theme
- [ ] Login successful with demo credentials
- [ ] Overview tab shows all 9 KPIs
- [ ] Charts render properly
- [ ] Map tab displays Ratnapura district
- [ ] List tab shows filterable incidents
- [ ] Real-time updates work (🟢 Live indicator)
- [ ] Navigation between tabs is smooth
- [ ] Responsive on mobile (if testing)

## 🎉 Success!

Your dashboard is now a modern, comprehensive command center with:
✅ Light, professional theme
✅ 9 actionable KPIs
✅ 4 data visualization charts
✅ Trend analysis capabilities
✅ Improved user experience
✅ Better decision support

**Enjoy your modernized dashboard!** 🚀

