"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { 
  CalendarDays, 
  Zap, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Play,
  BarChart3,
  Globe,
  Shield,
  Sparkles,
  ChevronDown
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleGetStarted = () => {
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ChillScheduler</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/auth")}>
              Sign In
            </Button>
            <Button size="sm" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by AWS EventBridge
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Schedule AI Tasks
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">Effortlessly</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Turn your AI prompts into automated workflows. Schedule Claude or GPT tasks to run on 
            autopilot - from daily reports to data analysis, all without writing a single line of code.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="md" onClick={handleGetStarted} className="group px-6 py-3">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="md" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3">
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Free tier available
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-16 animate-bounce">
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Stop Running Manual AI Tasks
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Let ChillScheduler handle the repetitive work while you focus on what matters
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">😩</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">The Old Way</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manually running the same AI prompts every day, copying results, 
                    forgetting to check important data, missing scheduled tasks...
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">😎</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">The Chill Way</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Set it once, runs forever. Your AI tasks execute on schedule, 
                    results are saved, and you get notified when important things happen.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium">Daily at 9:00 AM</span>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Prompt:</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    &quot;Analyze today&apos;s crypto market trends and summarize the top 3 opportunities&quot;
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Next run: in 2 hours</span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-emerald-600 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Automate AI
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Powerful features that make scheduling AI tasks a breeze
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "One-Click Scheduling",
                description: "Turn any AI prompt into a scheduled job in seconds. No coding required."
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Flexible Timing",
                description: "Run tasks hourly, daily, weekly, or create custom cron schedules."
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Execution History",
                description: "Track all job runs, view results, and monitor performance over time."
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "API Integration",
                description: "Works with Claude, GPT-4, and any AI model with an API."
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Enterprise Security",
                description: "Built on AWS with bank-level encryption and compliance."
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Smart Retries",
                description: "Automatic retry logic ensures your critical tasks never fail."
              }
            ].map((feature, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 group-hover:border-emerald-500/50 transition-colors">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              From sign up to your first automated task in under 5 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Write Your Prompt",
                description: "Describe what you want the AI to do in plain English",
                example: '&quot;Summarize tech news and email me the highlights&quot;'
              },
              {
                step: "2",
                title: "Set Your Schedule",
                description: "Choose when and how often the task should run",
                example: "Every weekday at 8:00 AM EST"
              },
              {
                step: "3",
                title: "Sit Back & Relax",
                description: "Your AI task runs automatically and saves results",
                example: "Check your dashboard for execution history"
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-emerald-300 to-emerald-600 -translate-x-1/2"></div>
                )}
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {item.description}
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 italic">
                    {item.example}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Watch how easy it is to create your first scheduled AI task
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-xs text-gray-400">ChillScheduler Dashboard</span>
            </div>
            <div className="p-8 flex items-center justify-center h-96 bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center">
                <Play className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <p className="text-gray-400">Demo video coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Automate Your AI Workflow?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of users who are saving hours every week
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-6 py-3 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-white/50 w-full sm:w-80"
            />
            <Button 
              size="md" 
              onClick={handleGetStarted}
              className="bg-white text-emerald-600 hover:bg-gray-100 w-full sm:w-auto px-6 py-3"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-sm text-emerald-200 mt-6">
            No credit card required · Free tier includes 100 executions/month
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">ChillScheduler</span>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Docs</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            © 2024 ChillScheduler. Built with ❤️ on AWS.
          </div>
        </div>
      </footer>
    </div>
  );
}