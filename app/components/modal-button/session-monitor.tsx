"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import SessionRevokedModal from "./session-revoked-modal";

export default function SessionMonitor() {
  const router = useRouter();

  const [sessionRevoked, setSessionRevoked] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      await axios.get("/api/session-status", {
        withCredentials: true,
      });
    } catch (error: unknown) {
      const axiosError = axios.isAxiosError(error);

      if (!axiosError) {
        return;
      }

      const status = error.response?.status;
      const code = error.response?.data?.code;

      if (
        status === 401 &&
        (
          code === "SESSION_REVOKED" ||
          code === "SESSION_EXPIRED" ||
          code === "SESSION_NOT_FOUND"
        )
      ) {
        setSessionRevoked(true);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      if (cancelled) return;

      await checkSession();
    };

    runCheck();

    const interval = window.setInterval(
      runCheck,
      30_000,
    );

    const handleFocus = () => {
      runCheck();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkSession]);

  const handleConfirm = async () => {
    try {
      await axios.post(
        "/api/auth/logout",
        {},
        {
          withCredentials: true,
        },
      );
    } catch {
      // Session có thể đã chết/revoked.
      // Vẫn tiếp tục redirect.
    } finally {
      setSessionRevoked(false);

      router.replace("/");
      router.refresh();
    }
  };

  return (
    <SessionRevokedModal
      open={sessionRevoked}
      onConfirm={handleConfirm}
    />
  );
}