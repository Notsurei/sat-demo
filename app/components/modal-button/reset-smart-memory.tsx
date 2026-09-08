"use client";

import React from "react";
import axios from "axios";

import { Button, Modal, Spinner } from "@heroui/react";

import {
  ArrowRotateLeft,
  TriangleExclamation,
  Check,
} from "@gravity-ui/icons";

export default function ResetSmartMemory() {
  const [isResetting, setIsResetting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleResetSmartMemory = async () => {
    try {
      setIsResetting(true);
      setError(null);

      await axios.delete("/api/practice/smart-memory");

      setSuccess(true);
    } catch (error) {
      console.error("Reset Smart Memory error:", error);

      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.error ??
          "Failed to reset Smart Memory.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSuccess(false);
      setError(null);
    }
  };

  return (
    <div
      className={[
        "mb-6 overflow-hidden rounded-2xl",
        "border border-default-200 bg-background",
        "shadow-sm",
      ].join(" ")}
    >
      <div
        className={[
          "flex flex-col gap-4 p-4",
          "sm:flex-row sm:items-center sm:justify-between",
          "sm:p-5",
        ].join(" ")}
      >
        {/* Left */}
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={[
              "flex size-11 shrink-0 items-center justify-center",
              "rounded-xl bg-primary/10 text-primary",
            ].join(" ")}
          >
            <ArrowRotateLeft className="size-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">
                Smart Memory
              </h3>

              <span
                className={[
                  "rounded-full bg-success/10",
                  "px-2 py-0.5",
                  "text-[10px] font-semibold",
                  "uppercase tracking-wide text-success",
                ].join(" ")}
              >
                Active
              </span>
            </div>

            <p className="mt-1 text-sm leading-6 text-default-500">
              Practiced questions are remembered and won't appear again in
              future practice sessions.
            </p>
          </div>
        </div>

        {/* Action */}
        <Modal onOpenChange={handleOpenChange}>
          <Button
            variant="outline"
            className={[
              "w-full shrink-0 gap-2",
              "border-danger/30 text-danger",
              "transition-all duration-200",
              "hover:border-danger hover:bg-danger/5",
              "sm:w-auto",
            ].join(" ")}
          >
            <ArrowRotateLeft className="size-4" />

            Reset Memory
          </Button>

          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="max-w-md">
                <Modal.CloseTrigger />

                {/* Header */}
                <Modal.Header className="border-b border-default-200">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "flex size-11 shrink-0",
                        "items-center justify-center",
                        "rounded-xl bg-danger/10 text-danger",
                      ].join(" ")}
                    >
                      <TriangleExclamation className="size-5" />
                    </div>

                    <div>
                      <Modal.Heading className="text-lg font-semibold">
                        Reset Smart Memory?
                      </Modal.Heading>

                      <p className="mt-1 text-sm text-default-500">
                        Your remembered questions will be cleared.
                      </p>
                    </div>
                  </div>
                </Modal.Header>

                {/* Body */}
                <Modal.Body className="space-y-4 py-5">
                  <div
                    className={[
                      "rounded-xl border border-warning/20",
                      "bg-warning/5 p-4",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <TriangleExclamation className="mt-0.5 size-4 shrink-0 text-warning" />

                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Questions will appear again
                        </p>

                        <p className="mt-1 text-sm leading-6 text-default-500">
                          Previously practiced questions can become available
                          again in future practice sessions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={[
                      "flex items-start gap-3",
                      "rounded-xl bg-success/5 p-4",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-6 shrink-0",
                        "items-center justify-center",
                        "rounded-full bg-success/10 text-success",
                      ].join(" ")}
                    >
                      <Check className="size-3.5" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Your history is safe
                      </p>

                      <p className="mt-1 text-sm leading-6 text-default-500">
                        Practice history, answers, scores, and results will not
                        be deleted.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div
                      className={[
                        "rounded-xl border border-danger/20",
                        "bg-danger/5 px-4 py-3",
                        "text-sm text-danger",
                      ].join(" ")}
                    >
                      {error}
                    </div>
                  )}

                  {success && (
                    <div
                      className={[
                        "flex items-center gap-3",
                        "rounded-xl border border-success/20",
                        "bg-success/5 p-4",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "flex size-7 shrink-0",
                          "items-center justify-center",
                          "rounded-full bg-success/10 text-success",
                        ].join(" ")}
                      >
                        <Check className="size-4" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-success">
                          Memory reset successfully
                        </p>

                        <p className="mt-1 text-xs text-default-500">
                          Previously practiced questions are available again.
                        </p>
                      </div>
                    </div>
                  )}
                </Modal.Body>

                {/* Footer */}
                <Modal.Footer className="border-t border-default-200">
                  <Button
                    variant="outline"
                    slot="close"
                    isDisabled={isResetting}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="danger-soft"
                    onClick={handleResetSmartMemory}
                    isDisabled={isResetting || success}
                    className="min-w-[145px] gap-2 font-semibold"
                  >
                    {isResetting ? (
                      <>
                        <Spinner size="sm" />
                        Resetting...
                      </>
                    ) : success ? (
                      <>
                        <Check className="size-4" />
                        Completed
                      </>
                    ) : (
                      <>
                        <ArrowRotateLeft className="size-4" />
                        Reset Memory
                      </>
                    )}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </div>
    </div>
  );
}