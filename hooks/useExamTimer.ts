import { useEffect, useRef } from "react";
import { useExamStore } from "@/zustand/exam-timer";

interface UseExamTimerProps {
  initialTime: number;
  onExpire?: () => void;
}

export function useExamTimer({ initialTime, onExpire }: UseExamTimerProps) {
  const { remainingTime, setRemainingTime } = useExamStore();

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setRemainingTime(initialTime);
      initialized.current = true;
    }
  }, [initialTime, setRemainingTime]);

  useEffect(() => {
    if (remainingTime <= 0) {
      onExpire?.();
      return;
    }

    const timer = setTimeout(() => {
      setRemainingTime(remainingTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [remainingTime, setRemainingTime, onExpire]);

  const minutes = Math.floor(remainingTime / 60);

  const seconds = remainingTime % 60;

  return {
    remainingTime,
    minutes,
    seconds,
  };
}
