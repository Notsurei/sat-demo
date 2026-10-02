"use client";

import React from "react";
import { useRouter } from "next/navigation";
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

import PracticeSetUp from "../forms/practice-set-up";

const MODES = [
  {
    id: "rw",
    icon: <BookOpen className="h-6 w-6" />,
    title: "Reading & Writing",
    description: "Reading & Writing modules only.",
  },
  {
    id: "math",
    icon: <ChartBar className="h-6 w-6" />,
    title: "Math",
    description: "SAT Math only.",
  },
  {
    id: "full",
    icon: <Thunderbolt className="h-6 w-6 text-yellow-200" />,
    title: "Full Test",
    description: "Simulate the complete Digital SAT.",
  },
  {
    id: "practice",
    icon: <span className="text-3xl">🎯</span>,
    title: "Targeted Practice",
    description: "Practice by topic and difficulty.",
  },
];

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

  const [isOpen, setIsOpen] = React.useState(false);
  const [showPracticeSetup, setShowPracticeSetup] = React.useState(false);
  const [isGeneratingFullTest, setIsGeneratingFullTest] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<
    string | null
  >(null);

  const [quota, setQuota] = React.useState<QuotaData | null>(null);
  const [quotaLoading, setQuotaLoading] = React.useState(false);

  const isBusy = isGeneratingFullTest;

  const fetchQuota = React.useCallback(async () => {
    try {
      setQuotaLoading(true);
      const { data } = await axios.get("/api/full-test/quota", {
        withCredentials: true,
      });
      if (data?.success) {
        setQuota(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch quota:", err);
      setQuota(null);
    } finally {
      setQuotaLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      void fetchQuota();
    }
  }, [isOpen, fetchQuota]);

  const isFullTestLocked = !quotaLoading && quota !== null && !quota.canStart;

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

      toast.success("Full test ready! Good luck 🎯", {
        description: "Starting your test session...",
      });

      setPendingNavigation(`/full-test/${examId}/session/${sessionId}`);
      setIsOpen(false);
    } catch (error: unknown) {
      console.error("Start full test error:", error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 403 && data?.code === "QUOTA_EXCEEDED") {
          toast.danger("Full test limit reached", {
            actionProps: {
              children: "Upgrade",
              onPress: () => router.push("/pages/pricing"),
              variant: "primary",
            },
            description:
              data?.message ?? "Please upgrade for more full test attempts.",
          });

          void fetchQuota();
          return;
        }

        if (status === 409) {
          const examId = data?.data?.examId ?? data?.examId;
          const sessionId =
            data?.data?.sessionId ?? data?.sessionId ?? data?.session?.id;

          if (examId && sessionId) {
            toast.warning("Resuming existing session", {
              description: "You already have an active full test session.",
            });
            setPendingNavigation(`/full-test/${examId}/session/${sessionId}`);
            setIsOpen(false);
            return;
          }
        }

        toast.danger("Failed to start full test", {
          actionProps: {
            children: "I got it",
            onPress: () => toast.clear(),
            variant: "tertiary",
          },
          description:
            data?.error ?? data?.message ?? "Please try again later.",
        });

        return;
      }

      toast.danger("Failed to start full test", {
        actionProps: {
          children: "I got it",
          onPress: () => toast.clear(),
          variant: "tertiary",
        },
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsGeneratingFullTest(false);
    }
  };

  const handleModeSelect = (mode: string) => {
    // ⛔ Chặn mọi tương tác khi full test đang chuẩn bị
    if (isBusy) return;

    if (
      mode !== "rw" &&
      mode !== "math" &&
      mode !== "full" &&
      mode !== "practice"
    ) {
      return;
    }

    switch (mode) {
      case "rw":
      case "math":
        setShowPracticeSetup(false);
        setIsOpen(false);
        break;

      case "full":
        if (isFullTestLocked) {
          toast.warning("Full Test Locked", {
            description:
              quota?.plan === "FREE"
                ? "Upgrade your plan to unlock full tests."
                : "You've reached your full test limit. Please upgrade.",
            actionProps: {
              children: "Upgrade",
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

  React.useEffect(() => {
    if (!pendingNavigation) return;
    const timer = window.setTimeout(() => {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pendingNavigation, router]);

  const mainModes = MODES.slice(0, 3);
  const practiceMode = MODES[3];

  const handleModalOpenChange = (open: boolean) => {
    if (isGeneratingFullTest && !open) return;
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
        📝 Start Test
      </Button>

      <Modal>
        <Modal.Backdrop isOpen={isOpen} onOpenChange={handleModalOpenChange}>
          <Modal.Container>
            <Modal.Dialog className="w-full max-w-5xl">
              {!isBusy && <Modal.CloseTrigger />}

              <Modal.Header className="flex items-center gap-2">
                <Dots9 />
                <span className="text-xl font-bold">Choose your test mode</span>
              </Modal.Header>

              <Modal.Body>
                <ScrollShadow className="max-h-[550px] w-full p-4">
                  <div className="space-y-4">
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                      {mainModes.map((mode) => {
                        const isFullTest = mode.id === "full";
                        const isFullTestLoading =
                          isFullTest && isGeneratingFullTest;
                        const isLocked = isFullTest && isFullTestLocked;

                        const isDisabledByBusy = isBusy && !isFullTestLoading;

                        return (
                          <div
                            key={mode.id}
                            onClick={() => {
                              if (isBusy) return;
                              if (!isFullTestLoading && !isLocked) {
                                handleModeSelect(mode.id);
                              } else if (isLocked) {
                                handleModeSelect(mode.id);
                              }
                            }}
                            className={`
                              group relative flex w-full flex-col items-start
                              gap-3 rounded-2xl border bg-content1 p-6
                              transition-all duration-200
                              ${
                                isLocked || isDisabledByBusy
                                  ? "cursor-not-allowed border-default-200 opacity-60"
                                  : "cursor-pointer border-default-200 hover:-translate-y-1 hover:border-primary hover:bg-primary-50 hover:shadow-lg dark:hover:bg-primary-950"
                              }
                              ${
                                isFullTestLoading
                                  ? "pointer-events-none opacity-70"
                                  : ""
                              }
                            `}
                            role="button"
                            tabIndex={isDisabledByBusy ? -1 : 0}
                            aria-disabled={isDisabledByBusy || isLocked}
                            onKeyDown={(e) => {
                              if (isBusy) return;
                              if (
                                (e.key === "Enter" || e.key === " ") &&
                                !isFullTestLoading &&
                                !isDisabledByBusy
                              ) {
                                e.preventDefault();
                                handleModeSelect(mode.id);
                              }
                            }}
                          >
                            {isFullTest && quota && (
                              <div className="absolute right-3 top-3">
                                {isLocked ? (
                                  <Chip
                                    size="sm"
                                    color="danger"
                                    variant="primary"
                                    className="font-semibold"
                                  >
                                    <Lock width={12} /> Locked
                                  </Chip>
                                ) : quota.unlimited ? (
                                  <Chip
                                    size="sm"
                                    color="success"
                                    variant="primary"
                                    className="font-semibold"
                                  >
                                    ∞ {quota.plan}
                                  </Chip>
                                ) : (
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
                                    {quota.remaining}/{quota.limit} left
                                  </Chip>
                                )}
                              </div>
                            )}

                            <div
                              className={`
                                flex h-14 w-14 items-center justify-center
                                rounded-2xl transition
                                ${
                                  isLocked || isDisabledByBusy
                                    ? "bg-default-100 text-default-400"
                                    : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                                }
                              `}
                            >
                              {isFullTestLoading ? (
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

                            {isFullTestLoading && (
                              <span className="text-xs font-medium text-primary">
                                Preparing your test...
                              </span>
                            )}

                            {isDisabledByBusy && (
                              <span className="text-xs font-medium text-default-400">
                                Please wait...
                              </span>
                            )}

                            {isLocked && quota?.plan === "FREE" && (
                              <span className="text-xs font-medium text-danger">
                                Upgrade to unlock
                              </span>
                            )}

                            {isLocked &&
                              quota?.plan !== "FREE" &&
                              !quota?.unlimited && (
                                <span className="text-xs font-medium text-danger">
                                  Limit reached — upgrade for more
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
                            ${
                              isBusy
                                ? "cursor-not-allowed border-default-200 opacity-60"
                                : "cursor-pointer hover:-translate-y-1 hover:border-primary hover:bg-primary-50 hover:shadow-lg dark:hover:bg-primary-950"
                            }
                            ${
                              showPracticeSetup && !isBusy
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
                              ${
                                isBusy
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
                              Please wait...
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
                            ${
                              isBusy
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
                                <PracticeSetUp />
                              </fieldset>
                            </div>
                          ) : (
                            <div className="text-center text-default-400">
                              <p className="text-sm">
                                Select &quot;Targeted Practice&quot;
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
                  isDisabled={isGeneratingFullTest}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
