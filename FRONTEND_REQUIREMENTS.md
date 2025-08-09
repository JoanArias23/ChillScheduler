# ChillScheduler Frontend Requirements Document

## 📋 Executive Summary

ChillScheduler is a visual dashboard for scheduling and managing AI-powered automation tasks. Team members can create natural language instructions that are executed by Claude AI at scheduled intervals, leveraging 85+ MCP (Model Context Protocol) integrations to interact with services like Slack, Discord, Jira, HubSpot, and more.

## 🎯 Purpose & Context

### What It Is
A web-based scheduling interface where non-technical team members can create automated workflows using plain English instructions instead of writing code. Think of it as "Cron for AI Agents" - where instead of scheduling scripts, you schedule AI prompts.

### Who Uses It
- **Marketing Team**: Schedule social media posts, content summaries, competitor analysis
- **Engineering Team**: Automate status reports, Jira ticket summaries, deployment notifications
- **Sales Team**: CRM updates, lead notifications, follow-up reminders
- **Operations**: Daily metrics reports, alert monitoring, data syncing

### The Problem It Solves
Teams need automation but don't want to write code or manage complex workflows. ChillScheduler lets anyone create sophisticated automations by simply describing what they want in plain English.

## 🏗️ Frontend Architecture

### Tech Stack
- **Framework**: Next.js 15.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: React hooks + AWS Amplify Data Client
- **Icons**: Lucide React
- **Backend**: AWS Amplify Gen 2 (DynamoDB + Lambda)
- **API Integration**: HTTP calls to `http://claude.chinchilla-ai.com:3000/query`

### Key Design Principles
1. **Simplicity First**: Non-technical users should understand everything at a glance
2. **Visual Feedback**: Clear status indicators, loading states, success/error messages
3. **Mobile Responsive**: Works on tablets for on-the-go management
4. **Real-time Updates**: Auto-refresh job statuses and execution history
5. **Error Prevention**: Validate inputs, provide helpful examples, prevent mistakes

## 📱 Frontend Components & Features

### 1. Dashboard Layout

#### Header
- **Logo & Title**: "ChillScheduler" with calendar icon
- **Status Bar**: Shows connection status to backend, current time, timezone
- **User Info**: Display current user (if auth implemented later)
- **Settings Icon**: Quick access to preferences

#### Navigation Tabs
Three main sections with clear visual separation:
- **Scheduled Jobs** (default view)
- **Create Job** 
- **Execution History**

### 2. Scheduled Jobs View

#### Job Cards Grid/List
Display all jobs as cards showing:
- **Job Name**: User-friendly title (e.g., "Bitcoin News Summary")
- **Status Badge**: 
  - 🟢 Active (running on schedule)
  - 🟡 Paused (temporarily disabled)
  - 🔴 Failed (last execution failed)
  - 🔵 Running (currently executing)
- **Schedule Display**: Human-readable format ("Every 4 hours" not "0 */4 * * *")
- **Last Run**: "2 hours ago" with success/failure indicator
- **Next Run**: "In 2 hours" or exact time
- **Quick Actions**:
  - ▶️ Run Now (manual trigger)
  - ⏸️ Pause/Resume
  - ✏️ Edit
  - 🗑️ Delete (with confirmation)
  - 📊 View History

#### Filtering & Sorting
- Filter by: Status (Active/Paused/Failed), Creator, Tag
- Sort by: Next run time, Last run time, Name, Creation date
- Search bar for finding jobs by name or prompt content

### 3. Create/Edit Job Form

#### Basic Information
- **Job Name** (required): Descriptive title
  - Placeholder: "Daily Standup Reminder"
  - Helper: "Choose a name that clearly describes what this job does"
  
- **AI Prompt** (required): The instruction for Claude
  - Large textarea with syntax highlighting for mentions (@slack-channel)
  - Character counter (recommended < 500 chars)
  - Example templates dropdown:
    - "Search for [topic] news and summarize top 3 stories"
    - "Get all [status] Jira tickets and post summary to Slack #[channel]"
    - "Check [metric] and alert #[channel] if above [threshold]"

#### Schedule Configuration
- **Schedule Type Selector**:
  - Simple Intervals (Every X minutes/hours/days)
  - Daily at specific time
  - Weekly on specific days
  - Monthly on specific date
  - Advanced (cron expression)
  
- **Visual Schedule Builder**:
  - Time picker for daily schedules
  - Day selector for weekly schedules
  - Calendar for monthly schedules
  - Live preview: "This job will run: Every weekday at 9:15 AM"

#### Advanced Options (Collapsible)
- **System Prompt**: Additional context for the AI
- **Max Turns**: Limit AI interactions (default: 10)
- **Timeout**: Max execution time (default: 5 minutes)
- **Tags**: Categorize jobs (e.g., "reporting", "alerts", "social")
- **Notification Settings**: 
  - Notify on success (email/Slack)
  - Notify on failure (email/Slack)

#### Form Actions
- **Test Run**: Execute once without saving to preview output
- **Save as Draft**: Save without enabling
- **Save & Enable**: Save and immediately activate
- **Cancel**: Return to jobs list

### 4. Execution History View

#### Timeline Display
Chronological list of all job executions:
- **Execution Entry**:
  - Job name with link to job details
  - Timestamp (exact time)
  - Duration (e.g., "2.3 seconds")
  - Status icon and color
  - Expand to see:
    - Full prompt sent
    - Claude's response
    - Tools/integrations used
    - Error details (if failed)

#### Filters
- Date range picker
- Filter by job
- Filter by status (Success/Failed/Timeout)
- Search within responses

#### Analytics Dashboard (Top of History)
- **Today's Stats**:
  - Total executions
  - Success rate
  - Average duration
  - Most active job
- **Mini charts**:
  - Executions over time (last 7 days)
  - Success rate trend
  - Popular execution hours

### 5. Job Detail Modal/Page

When clicking on a job from the list:
- **Overview Tab**:
  - All job configuration details
  - Creation date and last modified
  - Total execution count
  - Success rate
  
- **Recent Executions Tab**:
  - Last 10 executions with full details
  - Re-run any past execution
  
- **Schedule Preview Tab**:
  - Calendar view showing next 10 scheduled runs
  - Option to skip next run
  
- **Settings Tab**:
  - Edit all job parameters
  - Clone job as template
  - Export/Import job configuration

## 🎨 UI/UX Requirements

### Visual Design
- **Color Scheme**:
  - Primary: Blue (#3B82F6) for actions and active states
  - Success: Green (#10B981) for successful executions
  - Warning: Yellow (#F59E0B) for paused or warnings
  - Error: Red (#EF4444) for failures
  - Neutral: Gray scale for backgrounds and text

- **Typography**:
  - Headers: Inter font, bold
  - Body: Inter font, regular
  - Code/Prompts: Monospace font

- **Spacing & Layout**:
  - Consistent 8px grid system
  - Card-based design with subtle shadows
  - Maximum content width: 1280px
  - Responsive breakpoints: Mobile (< 640px), Tablet (640-1024px), Desktop (> 1024px)

### Interaction Patterns
- **Loading States**:
  - Skeleton screens for initial data load
  - Inline spinners for actions
  - Progress bars for long-running operations

- **Error Handling**:
  - Toast notifications for transient errors
  - Inline error messages for form validation
  - Full-page error boundary for critical failures
  - Retry buttons where applicable

- **Success Feedback**:
  - Green toast notifications
  - Confetti animation for first job creation
  - Smooth transitions when updating data

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly status messages
- Color contrast ratio > 4.5:1

## 🔄 State Management

### Local State
- Current view (jobs/create/history)
- Form data during job creation/editing
- UI preferences (list vs grid view, sort order)
- Search/filter criteria

### Server State (via Amplify)
- Jobs list with real-time updates
- Execution history
- Job statistics
- Current execution status

### Caching Strategy
- Cache job list for 30 seconds
- Cache execution history for 5 minutes
- Invalidate cache on job creation/update/deletion
- Optimistic updates for better UX

## 📊 Data Flow

### Creating a Job
1. User fills form → Validation → Save to DynamoDB
2. Calculate next run time based on schedule
3. Update UI optimistically
4. Confirm save with toast notification

### Executing a Job
1. Manual trigger or scheduled execution
2. Update job status to "running"
3. Call Claude API with prompt
4. Store execution result in JobExecutions table
5. Update job's last run status and time
6. Refresh UI to show new status

### Viewing History
1. Fetch paginated execution records
2. Group by date for better readability
3. Lazy load full execution details on expand
4. Enable infinite scroll for older records

## 🚀 Performance Requirements

- **Initial Load**: < 2 seconds
- **Navigation**: Instant (client-side routing)
- **API Calls**: Show loading state after 200ms
- **Auto-refresh**: Every 30 seconds for active jobs
- **Bundle Size**: < 200KB for initial JS

## 🔐 Security Considerations

- Sanitize all user inputs before display
- Validate cron expressions to prevent abuse
- Rate limiting on manual job triggers
- Secure storage of any API keys (if needed later)
- XSS prevention in prompt display

## 📱 Responsive Design Breakpoints

### Mobile (< 640px)
- Stack navigation tabs vertically
- Show jobs as full-width cards
- Simplified form with sections
- Bottom sheet for job actions

### Tablet (640-1024px)
- 2-column grid for job cards
- Side-by-side form sections
- Modal overlays for details

### Desktop (> 1024px)
- 3-column grid for job cards
- Full form visible without scrolling
- Split view for list and details

## 🎯 Success Metrics

- Users can create a job in < 2 minutes
- 90% of jobs run successfully
- < 1% of users need documentation
- Mobile usage > 30%
- Average session time > 5 minutes

## 🚦 MVP vs Future Features

### MVP (Phase 1)
✅ All features described above

### Future Enhancements (Phase 2)
- User authentication and job ownership
- Team workspaces
- Job templates marketplace
- Webhook triggers in addition to time-based
- Job chaining and dependencies
- Cost tracking per job
- A/B testing for prompts
- Version history for job configurations
- Slack/Discord bot for job management
- API for programmatic job creation