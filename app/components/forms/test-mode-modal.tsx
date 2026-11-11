"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Button,
  Modal,
  ScrollShadow,
  toast,
  Spinner,
  Chip,
} from "@heroui/react";
import {
  BookOpen,
  ChartBar,
  Dots9,
  Thunderbolt,
  Lock,
} from "@gravity-ui/icons";
import axios from "axios";

import { useAuthStore } from "@/zustand/auth-store";

import PracticeSetUp from "./practice-set-up";

interface QuotaData {
  plan: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  unlimited: boolean;
  canStart: boolean;
  label: string;
}

export default function TestModeModal() {
  const router = useRouter();
  const t = useTranslations("testModeModal");

  const { user } = useAuthStore();
  const isFreePlan =
    !user?.subscriptionPlan || user.subscriptionPlan === "FREE";

  const MODES = React.useMemo(
    () => [
      {
        id: "rw",
        icon: <BookOpen className="h-6 w-6 text-red-300" />,
        title: t("modes.rw.title"),
        description: t("modes.rw.description"),
      },
      {
        id: "math",
        icon: <ChartBar className="h-6 w-6 text-orange-300" />,
        title: t("modes.math.title"),
        description: t("modes.math.description"),
      },
      {
        id: "full",
        icon: <Thunderbolt className="h-6 w-6 text-yellow-200" />,
        title: t("modes.full.title"),
        description: t("modes.full.description"),
      },
      {
        id: "practice",
        icon: <span className="text-3xl">🎯</span>,
        title: t("modes.practice.title"),
        description: t("modes.practice.description"),
      },
    ],
    [t],
  );

  const [isOpen, setIsOpen] = React.useState(false);
  const [showPracticeSetup, setShowPracticeSetup] = React.useState(false);

  const [isGeneratingFullTest, setIsGeneratingFullTest] = React.useState(false);
  const [isGeneratingMathTest, setIsGeneratingMathTest] = React.useState(false);
  const [isGeneratingRwTest, setIsGeneratingRwTest] = React.useState(false);

  const [pendingNavigation, setPendingNavigation] = React.useState<
    string | null
  >(null);

  const [fullTestQuota, setFullTestQuota] = React.useState<QuotaData | null>(
    null,
  );
  const [mathQuota, setMathQuota] = React.useState<QuotaData | null>(null);
  const [rwQuota, setRwQuota] = React.useState<QuotaData | null>(null);
  const [quotaLoading, setQuotaLoading] = React.useState(false);
  const [isPracticeLoading, setIsPracticeLoading] = React.useState(false);

  const isBusy =
    isGeneratingFullTest ||
    isGeneratingMathTest ||
    isGeneratingRwTest ||
    isPracticeLoading;

  const fetchQuotas = React.useCallback(async () => {
    try {
      setQuotaLoading(true);

      const [fullRes, mathRes, rwRes] = await Promise.allSettled([
        axios.get("/api/full-test/quota", { withCredentials: true }),
        axios.get("/api/math-module-test/quota", { withCredentials: true }),
        axios.get("/api/rw-module-test/quota", { withCredentials: true }),
      ]);

      setFullTestQuota(
        fullRes.status === "fulfilled" && fullRes.value.data?.success
          ? fullRes.value.data.data
          : null,
      );
      setMathQuota(
        mathRes.status === "fulfilled" && mathRes.value.data?.success
          ? mathRes.value.data.data
          : null,
      );
      setRwQuota(
        rwRes.status === "fulfilled" && rwRes.value.data?.success
          ? rwRes.value.data.data
          : null,
      );
    } catch (err) {
      console.error("Failed to fetch quotas:", err);
    } finally {
      setQuotaLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) void fetchQuotas();
  }, [isOpen, fetchQuotas]);

  React.useEffect(() => {
    if (!pendingNavigation) return;
    const timer = window.setTimeout(() => {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pendingNavigation, router]);

  const resolveLocked = (quota: QuotaData | null): boolean => {
    if (quotaLoading) return false;
    if (quota === null) return isFreePlan;
    return !quota.canStart;
  };

  const isFullTestLocked = resolveLocked(fullTestQuota);
  const isMathTestLocked = resolveLocked(mathQuota);
  const isRwTestLocked = resolveLocked(rwQuota);

  const startFullTest = async () => {
    if (isGeneratingFullTest) return;
    if (isFullTestLocked) return;

    try {
      setIsGeneratingFullTest(true);

      const generateResponse = await axios.post(
        "/api/full-test/generate",
        { title: "SAT Full Test" },
        { withCredentials: true },
      );

      const examId =
        generateResponse.data?.data?.examId ?? generateResponse.data?.examId;
      if (!examId) throw new Error("Exam ID not found");

      const startResponse = await axios.post(
        `/api/full-test/${examId}/start`,
        {},
        { withCredentials: true },
      );

      const sessionId =
        startResponse.data?.data?.sessionId ??
        startResponse.data?.sessionId ??
        startResponse.data?.session?.id;
      if (!sessionId) throw new Error("Session ID not found");

      toast.success(t("toasts.fullTestReady.title"), {
        description: t("toasts.fullTestReady.description"),
      });

      setPendingNavigation(`/full-test/${examId}/session/${sessionId}`);
      setIsOpen(false);
    } catch (error: unknown) {
      console.error("Start full test error:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
          toast.danger("Session expired", {
            actionProps: {
              children: "Sign in",
              onPress: () => router.push("/pages/signin"),
              variant: "primary",
            },
            description: "Please sign in again to continue.",
          });
          return;
        }

        if (status === 403) {
          const isQuotaCode = data?.code === "QUOTA_EXCEEDED";
          toast.danger(
            isQuotaCode
              ? t("toasts.fullTestLimitReached.title")
              : t("toasts.fullTestLocked.title"),
            {
              actionProps: {
                children: t("upgradeButton"),
                onPress: () => router.push("/pages/pricing"),
                variant: "primary",
              },
              description:
                data?.message?.trim() ||
                data?.error?.trim() ||
                (isQuotaCode
                  ? t("toasts.fullTestLimitReached.description")
                  : t("toasts.fullTestLocked.descriptionFree")),
            },
          );
          void fetchQuotas();
          return;
        }

        if (status === 409) {
          const examId = data?.data?.examId ?? data?.examId;
          const sessionId =
            data?.data?.sessionId ?? data?.sessionId ?? data?.session?.id;

          if (examId && sessionId) {
            toast.warning(t("toasts.resumeFullTest.title"), {
              description: t("toasts.resumeFullTest.description"),
            });
            setPendingNavigation(`/full-test/${examId}/session/${sessionId}`);
            setIsOpen(false);
            return;
          }
        }

        toast.danger(t("toasts.startFullTestFailed.title"), {
          actionProps: {
            children: t("gotItButton"),
            onPress: () => toast.clear(),
            variant: "tertiary",
          },
          description:
            data?.error?.trim() ||
            data?.message?.trim() ||
            t("toasts.startFullTestFailed.description"),
        });
        return;
      }

      toast.danger(t("toasts.startFullTestFailed.title"), {
        actionProps: {
          children: t("gotItButton"),
          onPress: () => toast.clear(),
          variant: "tertiary",
        },
        description:
          error instanceof Error
            ? error.message
            : t("toasts.startFullTestFailed.genericDescription"),
      });
    } finally {
      setIsGeneratingFullTest(false);
    }
  };

  const startMathTest = async () => {
    if (isGeneratingMathTest) return;
    if (isMathTestLocked) return;

    try {
      setIsGeneratingMathTest(true);

      const genRes = await axios.post(
        "/api/math-module-test/generate",
        { title: "SAT Math Module" },
        { withCredentials: true },
      );

      /* ── FIX: lấy examId từ response, KHÔNG phải sectionId ── */
      const examId =
        genRes.data?.data?.examId ?? genRes.data?.examId;

      if (!examId) {
        console.error("[math] generate response:", genRes.data);
        throw new Error("Math exam ID not found in generate response");
      }

      const startRes = await axios.post(
        `/api/math-module-test/${examId}/start`,
        {},
        { withCredentials: true },
      );

      const sessionId = startRes.data?.data?.sessionId;
      if (!sessionId) throw new Error("Session ID not found");

      toast.success(t("toasts.mathTestReady.title"), {
        description: t("toasts.mathTestReady.description"),
      });

      setPendingNavigation(`/math-module-test/${sessionId}`);
      setIsOpen(false);
    } catch (error: unknown) {
      console.error("Start math test error:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
          toast.danger("Session expired", {
            actionProps: {
              children: "Sign in",
              onPress: () => router.push("/pages/signin"),
              variant: "primary",
            },
            description: "Please sign in again to continue.",
          });
          return;
        }

        if (status === 403) {
          const isQuotaCode = data?.code === "QUOTA_EXCEEDED";
          toast.danger(
            isQuotaCode
              ? t("toasts.mathTestLimitReached.title")
              : t("toasts.mathTestLocked.title"),
            {
              actionProps: {
                children: t("upgradeButton"),
                onPress: () => router.push("/pages/pricing"),
                variant: "primary",
              },
              description:
                data?.message?.trim() ||
                data?.error?.trim() ||
                (isQuotaCode
                  ? t("toasts.mathTestLimitReached.description")
                  : t("toasts.mathTestLocked.descriptionFree")),
            },
          );
          void fetchQuotas();
          return;
        }

        if (status === 409) {
          const existingSessionId = data?.data?.sessionId ?? data?.sessionId;
          if (existingSessionId) {
            toast.warning(t("toasts.resumeMathTest.title"), {
              description: t("toasts.resumeMathTest.description"),
            });
            setPendingNavigation(`/math-module-test/${existingSessionId}`);
            setIsOpen(false);
            return;
          }
        }

        toast.danger(t("toasts.startMathTestFailed.title"), {
          actionProps: {
            children: t("gotItButton"),
            onPress: () => toast.clear(),
            variant: "tertiary",
          },
          description:
            data?.error?.trim() ||
            data?.message?.trim() ||
            t("toasts.startMathTestFailed.description"),
        });
        return;
      }

      toast.danger(t("toasts.startMathTestFailed.title"), {
        actionProps: {
          children: t("gotItButton"),
          onPress: () => toast.clear(),
          variant: "tertiary",
        },
        description:
          error instanceof Error
            ? error.message
            : t("toasts.startMathTestFailed.genericDescription"),
      });
    } finally {
      setIsGeneratingMathTest(false);
    }
  };

  const startRwTest = async () => {
    if (isGeneratingRwTest) return;
    if (isRwTestLocked) return;

    try {
      setIsGeneratingRwTest(true);

      const genRes = await axios.post(
        "/api/rw-module-test/generate",
        { title: "SAT RW Module" },
        { withCredentials: true },
      );

      /* ── FIX: lấy examId từ response, KHÔNG phải sectionId ── */
      const examId =
        genRes.data?.data?.examId ?? genRes.data?.examId;

      if (!examId) {
        console.error("[rw] generate response:", genRes.data);
        throw new Error("RW exam ID not found in generate response");
      }

      const startRes = await axios.post(
        `/api/rw-module-test/${examId}/start`,
        {},
        { withCredentials: true },
      );

      const sessionId = startRes.data?.data?.sessionId;
      if (!sessionId) throw new Error("Session ID not found");

      toast.success(t("toasts.rwTestReady.title"), {
        description: t("toasts.rwTestReady.description"),
      });

      setPendingNavigation(`/rw-module-test/${sessionId}`);
      setIsOpen(false);
    } catch (error: unknown) {
      console.error("Start RW test error:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
          toast.danger("Session expired", {
            actionProps: {
              children: "Sign in",
              onPress: () => router.push("/pages/signin"),
              variant: "primary",
            },
            description: "Please sign in again to continue.",
          });
          return;
        }

        if (status === 403) {
          const isQuotaCode = data?.code === "QUOTA_EXCEEDED";
          toast.danger(
            isQuotaCode
              ? t("toasts.rwTestLimitReached.title")
              : t("toasts.rwTestLocked.title"),
            {
              actionProps: {
                children: t("upgradeButton"),
                onPress: () => router.push("/pages/pricing"),
                variant: "primary",
              },
              description:
                data?.message?.trim() ||
                data?.error?.trim() ||
                (isQuotaCode
                  ? t("toasts.rwTestLimitReached.description")
                  : t("toasts.rwTestLocked.descriptionFree")),
            },
          );
          void fetchQuotas();
          return;
        }

        if (status === 409) {
          const existingSessionId = data?.data?.sessionId ?? data?.sessionId;
          if (existingSessionId) {
            toast.warning(t("toasts.resumeRwTest.title"), {
              description: t("toasts.resumeRwTest.description"),
            });
            setPendingNavigation(`/rw-module-test/${existingSessionId}`);
            setIsOpen(false);
            return;
          }
        }

        toast.danger(t("toasts.startRwTestFailed.title"), {
          actionProps: {
            children: t("gotItButton"),
            onPress: () => toast.clear(),
            variant: "tertiary",
          },
          description:
            data?.error?.trim() ||
            data?.message?.trim() ||
            t("toasts.startRwTestFailed.description"),
        });
        return;
      }

      toast.danger(t("toasts.startRwTestFailed.title"), {
        actionProps: {
          children: t("gotItButton"),
          onPress: () => toast.clear(),
          variant: "tertiary",
        },
        description:
          error instanceof Error
            ? error.message
            : t("toasts.startRwTestFailed.genericDescription"),
      });
    } finally {
      setIsGeneratingRwTest(false);
    }
  };

  const handleModeSelect = (mode: string) => {
    if (isBusy) return;

    switch (mode) {
      case "rw":
        if (isRwTestLocked) {
          toast.warning(t("toasts.rwTestLocked.title"), {
            description: isFreePlan
              ? t("toasts.rwTestLocked.descriptionFree")
              : t("toasts.rwTestLocked.descriptionLimited"),
            actionProps: {
              children: t("upgradeButton"),
              onPress: () => router.push("/pages/pricing"),
              variant: "primary",
            },
          });
          return;
        }
        setShowPracticeSetup(false);
        void startRwTest();
        break;

      case "math":
        if (isMathTestLocked) {
          toast.warning(t("toasts.mathTestLocked.title"), {
            description: isFreePlan
              ? t("toasts.mathTestLocked.descriptionFree")
              : t("toasts.mathTestLocked.descriptionLimited"),
            actionProps: {
              children: t("upgradeButton"),
              onPress: () => router.push("/pages/pricing"),
              variant: "primary",
            },
          });
          return;
        }
        setShowPracticeSetup(false);
        void startMathTest();
        break;

      case "full":
        if (isFullTestLocked) {
          toast.warning(t("toasts.fullTestLocked.title"), {
            description: isFreePlan
              ? t("toasts.fullTestLocked.descriptionFree")
              : t("toasts.fullTestLocked.descriptionLimited"),
            actionProps: {
              children: t("upgradeButton"),
              onPress: () => router.push("/pages/pricing"),
              variant: "primary",
            },
          });
          return;
        }
        setShowPracticeSetup(false);
        void startFullTest();
        break;

      case "practice":
        setShowPracticeSetup(true);
        break;
    }
  };

  const mainModes = MODES.slice(0, 3);
  const practiceMode = MODES[3];

  const handleModalOpenChange = (open: boolean) => {
    if (isBusy && !open) return;
    setIsOpen(open);
    if (!open && !pendingNavigation) setShowPracticeSetup(false);
  };

  return (
    <>
      <Button
        variant="primary"
        className="rounded-full px-6 font-semibold"
        onPress={() => setIsOpen(true)}
        isDisabled={isBusy}
      >
        {t("startButton")}
      </Button>

      <Modal>
        <Modal.Backdrop isOpen={isOpen} onOpenChange={handleModalOpenChange}>
          <Modal.Container>
            <Modal.Dialog className="w-full max-w-5xl">
              {!isBusy && <Modal.CloseTrigger />}

              <Modal.Header className="flex items-center gap-2">
                <Dots9 />
                <span className="text-xl font-bold">{t("modalTitle")}</span>
              </Modal.Header>

              <Modal.Body>
                <ScrollShadow className="max-h-[550px] w-full p-4">
                  <div className="space-y-4">
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                      {mainModes.map((mode) => {
                        const isFullTest = mode.id === "full";
                        const isMathTest = mode.id === "math";
                        const isRwTest = mode.id === "rw";

                        const isLoading =
                          (isFullTest && isGeneratingFullTest) ||
                          (isMathTest && isGeneratingMathTest) ||
                          (isRwTest && isGeneratingRwTest);

                        const isLocked = isFullTest
                          ? isFullTestLocked
                          : isMathTest
                            ? isMathTestLocked
                            : isRwTest
                              ? isRwTestLocked
                              : false;

                        const quota = isFullTest
                          ? fullTestQuota
                          : isMathTest
                            ? mathQuota
                            : isRwTest
                              ? rwQuota
                              : null;

                        const isDisabledByBusy = isBusy && !isLoading;

                        return (
                          <div
                            key={mode.id}
                            onClick={() => {
                              if (isBusy) return;
                              if (!isLoading) handleModeSelect(mode.id);
                            }}
                            className={`
                              group relative flex w-full flex-col items-start
                              gap-3 rounded-2xl border bg-content1 p-6
                              transition-all duration-200
                              ${isLocked || isDisabledByBusy
                                ? "cursor-not-allowed border-default-200 opacity-60"
                                : "cursor-pointer border-default-200 hover:-translate-y-1 hover:border-primary hover:bg-primary-50 hover:shadow-lg dark:hover:bg-primary-950"
                              }
                              ${isLoading ? "pointer-events-none opacity-70" : ""}
                            `}
                            role="button"
                            tabIndex={isDisabledByBusy ? -1 : 0}
                            aria-disabled={isDisabledByBusy || isLocked}
                            onKeyDown={(e) => {
                              if (isBusy) return;
                              if (
                                (e.key === "Enter" || e.key === " ") &&
                                !isLoading &&
                                !isDisabledByBusy
                              ) {
                                e.preventDefault();
                                handleModeSelect(mode.id);
                              }
                            }}
                          >
                            {(isFullTest || isMathTest || isRwTest) &&
                              (isLocked || quota) && (
                                <div className="absolute right-3 top-3">
                                  {isLocked ? (
                                    <Chip
                                      size="sm"
                                      color="danger"
                                      variant="primary"
                                      className="font-semibold"
                                    >
                                      <Lock width={12} /> {t("quota.locked")}
                                    </Chip>
                                  ) : quota?.unlimited ? (
                                    <Chip
                                      size="sm"
                                      color="success"
                                      variant="primary"
                                      className="font-semibold bg-green-300"
                                    >
                                      {t("quota.unlimited", {
                                        plan: quota.plan,
                                      })}
                                    </Chip>
                                  ) : quota ? (
                                    <Chip
                                      size="sm"
                                      color={
                                        (quota.remaining ?? 0) > 1
                                          ? "success"
                                          : "warning"
                                      }
                                      variant="primary"
                                      className="font-semibold"
                                    >
                                      {t("quota.remaining", {
                                        remaining: quota.remaining ?? 0,
                                        limit: quota.limit ?? 0,
                                      })}
                                    </Chip>
                                  ) : null}
                                </div>
                              )}

                            <div
                              className={`
                                flex h-14 w-14 items-center justify-center
                                rounded-2xl transition
                                ${isLocked || isDisabledByBusy
                                  ? "bg-default-100 text-default-400"
                                  : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                                }
                              `}
                            >
                              {isLoading ? (
                                <Spinner size="sm" color="current" />
                              ) : isLocked || isDisabledByBusy ? (
                                <Lock className="h-6 w-6" />
                              ) : (
                                mode.icon
                              )}
                            </div>

                            <h3 className="text-lg font-semibold">
                              {mode.title}
                            </h3>

                            <p className="text-sm text-default-500">
                              {mode.description}
                            </p>

                            {isLoading && (
                              <span className="text-xs font-medium text-primary">
                                {isFullTest
                                  ? t("loading.preparingFullTest")
                                  : isMathTest
                                    ? t("loading.preparingMathTest")
                                    : t("loading.preparingRwTest")}
                              </span>
                            )}

                            {isDisabledByBusy && (
                              <span className="text-xs font-medium text-default-400">
                                {t("loading.pleaseWait")}
                              </span>
                            )}

                            {/* ── Text dưới: không phụ thuộc quota.plan ── */}
                            {isLocked && (
                              <span className="text-xs font-medium text-danger">
                                {isFreePlan
                                  ? t("quota.upgradeToUnlock")
                                  : t("quota.limitReached")}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-[3fr_7fr]">
                      <div className="w-full min-w-0">
                        <div
                          onClick={() => {
                            if (isBusy) return;
                            handleModeSelect(practiceMode.id);
                          }}
                          className={`
                            group flex h-full w-full flex-col items-start
                            gap-3 rounded-2xl border p-6 transition-all
                            ${isBusy
                              ? "cursor-not-allowed border-default-200 opacity-60"
                              : "cursor-pointer hover:-translate-y-1 hover:border-primary hover:bg-primary-50 hover:shadow-lg dark:hover:bg-primary-950"
                            }
                            ${showPracticeSetup && !isBusy
                              ? "border-primary bg-primary-50 dark:bg-primary-950"
                              : "border-default-200 bg-content1"
                            }
                          `}
                          role="button"
                          tabIndex={isBusy ? -1 : 0}
                          aria-disabled={isBusy}
                          onKeyDown={(e) => {
                            if (isBusy) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleModeSelect(practiceMode.id);
                            }
                          }}
                        >
                          <div
                            className={`
                              flex h-14 w-14 items-center justify-center
                              rounded-2xl transition
                              ${isBusy
                                ? "bg-default-100 text-default-400"
                                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                              }
                            `}
                          >
                            {practiceMode.icon}
                          </div>

                          <h3 className="text-lg font-semibold">
                            {practiceMode.title}
                          </h3>

                          <p className="text-sm text-default-500">
                            {practiceMode.description}
                          </p>

                          {isBusy && (
                            <span className="text-xs font-medium text-default-400">
                              {t("loading.pleaseWait")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full min-w-0">
                        <div
                          className={`
                            flex min-h-[150px] h-full w-full items-center
                            justify-center rounded-2xl border border-dashed
                            p-4 transition-opacity
                            ${isBusy
                              ? "pointer-events-none border-default-200 bg-default-50/30 opacity-60 dark:bg-default-800/30"
                              : "border-default-300 bg-default-50/50 dark:bg-default-800/50"
                            }
                          `}
                          aria-disabled={isBusy}
                        >
                          {showPracticeSetup ? (
                            <div className="w-full">
                              <fieldset
                                disabled={isBusy}
                                className="w-full border-0 p-0"
                              >
                                <PracticeSetUp
                                  onLoadingChange={setIsPracticeLoading}
                                />
                              </fieldset>
                            </div>
                          ) : (
                            <div className="text-center text-default-400">
                              <p className="text-sm">
                                {t("practiceSetupPlaceholder")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollShadow>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="outline"
                  onPress={() => setIsOpen(false)}
                  isDisabled={isBusy}
                >
                  {t("closeButton")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}