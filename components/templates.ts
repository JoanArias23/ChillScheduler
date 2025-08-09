export type Template = {
  id: string;
  name: string;
  prompt: string;
  schedule: string; // cron
  description?: string;
};

export const TEMPLATES: Template[] = [
  {
    id: "news-summary",
    name: "News Summary",
    prompt: "Search for {{topic}} news and summarize top 3 stories for #marketing",
    schedule: "0 9 * * 1-5",
    description: "Weekday morning news digest.",
  },
  {
    id: "jira-standup",
    name: "Jira Standup",
    prompt: "Get all In Progress Jira tickets for team {{team}} and post summary to #eng-standup",
    schedule: "15 9 * * 1-5",
    description: "Daily standup summary at 9:15am.",
  },
  {
    id: "metric-alert",
    name: "Metric Alert",
    prompt: "Check {{metric}} and alert #ops if above {{threshold}}",
    schedule: "*/30 * * * *",
    description: "Check every 30 minutes.",
  },
];

