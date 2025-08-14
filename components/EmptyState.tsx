import { CalendarPlus, Sparkles, Clock } from "lucide-react";
import Button from "./ui/Button";

interface EmptyStateProps {
  onCreateJob: () => void;
}

export default function EmptyState({ onCreateJob }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-2xl opacity-50" />
        <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-6 rounded-full">
          <CalendarPlus size={48} className="text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-black dark:text-gray-100 mb-2">
        No scheduled jobs yet
      </h2>
      
      <p className="text-gray-900 dark:text-gray-400 text-center max-w-md mb-8">
        Create your first AI-powered scheduled task. Automate repetitive work with custom prompts that run on your schedule.
      </p>
      
      <Button onClick={onCreateJob} size="md" className="mb-8">
        <Sparkles size={18} />
        Create Your First Job
      </Button>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
        <div className="text-center p-4">
          <Clock className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Set Schedule</p>
          <p className="text-xs text-gray-700 dark:text-gray-400">Hourly, daily, or custom</p>
        </div>
        <div className="text-center p-4">
          <Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">AI Executes</p>
          <p className="text-xs text-gray-700 dark:text-gray-400">Runs automatically</p>
        </div>
        <div className="text-center p-4">
          <CalendarPlus className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Track Results</p>
          <p className="text-xs text-gray-700 dark:text-gray-400">View history anytime</p>
        </div>
      </div>
    </div>
  );
}