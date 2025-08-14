import { useEffect, useState } from "react";

export function useCountdown(targetDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
    formatted: string;
    isOverdue: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    formatted: "—",
    isOverdue: false,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        // Overdue
        const overdueSec = Math.floor(Math.abs(difference) / 1000);
        const overdueMin = Math.floor(overdueSec / 60);
        const overdueHr = Math.floor(overdueMin / 60);
        
        let formatted = "Overdue";
        if (overdueHr > 0) {
          formatted = `Overdue by ${overdueHr}h`;
        } else if (overdueMin > 0) {
          formatted = `Overdue by ${overdueMin}m`;
        } else {
          formatted = `Overdue by ${overdueSec}s`;
        }

        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: difference,
          formatted,
          isOverdue: true,
        });
        return;
      }

      // Calculate time components
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Format the string
      let formatted = "";
      if (days > 0) {
        formatted = `${days}d ${hours}h`;
      } else if (hours > 0) {
        formatted = `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        formatted = `${minutes}m ${seconds}s`;
      } else {
        formatted = `${seconds}s`;
      }

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
        formatted,
        isOverdue: false,
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}