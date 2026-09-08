"use client";

import React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button, Modal, Spinner } from "@heroui/react";
import { ArrowRotateLeft, TriangleExclamation, Check } from "@gravity-ui/icons";
import { usePracticeStore } from "@/zustand/practice-store";

type RetryPracticeButtonProps = {
  practiceId: string;
  incorrectCount: number;
};

export default function RetryPracticeButton({
  practiceId,
  incorrectCount,
}: RetryPracticeButtonProps) {
  const router = useRouter();

  const [isRetrying, setIsRetrying] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      setError(null);

      const response = await axios.post(`/api/practice/retry/${practiceId}`);

      if (response.data.success) {
        usePracticeStore.setState({
          practiceId: response.data.practiceId,
          questions: response.data.questions,
          currentQuestion: 0,
        });

        router.push(`/practice/${response.data.practiceId}`);
      }
    } catch (error) {
      console.error("Retry practice error:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.code === "NO_RETRY_QUESTIONS") {
          alert("🎉 Great job! No incorrect or slow questions to retry.");
          return;
        }
        setError(error.response?.data?.error || "Failed to retry practice.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsRetrying(false);
    }
  };

  if (incorrectCount === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
          <Check className="size-5" />
        </div>

        <div>
          <p className="text-sm font-semibold">Perfect score!</p>

          <p className="text-xs text-default-500">
            You have no incorrect questions to retry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Modal>
      <Button variant="outline" className="min-w-[200px]">
        <ArrowRotateLeft className="size-4" />
        Retry Wrong Questions
        <span className="ml-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs">
          {incorrectCount}
        </span>
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />

            <Modal.Header>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <ArrowRotateLeft className="size-5" />
                </div>

                <div>
                  <Modal.Heading>Retry Wrong Questions?</Modal.Heading>

                  <p className="mt-1 text-sm text-default-500">
                    Practice the questions you answered incorrectly.
                  </p>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body>
              <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                  <TriangleExclamation className="mt-0.5 size-4 shrink-0 text-warning" />

                  <div>
                    <p className="text-sm font-medium">
                      {incorrectCount} question
                      {incorrectCount > 1 ? "s" : ""} will be included.
                    </p>

                    <p className="mt-1 text-sm text-default-500">
                      A new practice session will be created. Your previous
                      practice result will remain unchanged.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="outline" slot="close">
                Cancel
              </Button>

              <Button variant="tertiary" onClick={handleRetry}>
                {isRetrying ? (
                  <>
                    <Spinner size="sm" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ArrowRotateLeft className="size-4" />
                    Start Retry
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}