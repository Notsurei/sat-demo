import React from "react";
import { Button, Modal } from "@heroui/react";
import type { ConfirmConfig } from "@/types/test-page";

interface ConfirmModalProps {
  config: ConfirmConfig | null;
  onClose: () => void;
}

export default function ConfirmModal({ config, onClose }: ConfirmModalProps) {
  const handleConfirm = async () => {
    if (!config) return;
    const { onConfirm } = config;
    onClose();
    await onConfirm();
  };

  return (
    <Modal
      isOpen={config !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="w-[calc(100vw-2rem)] sm:max-w-md">
            <Modal.Header className="border-b border-default-200">
              <Modal.Heading className="text-lg font-semibold">
                {config?.title}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="py-4">
              <p className="text-sm leading-6 text-default-600">
                {config?.description}
              </p>
            </Modal.Body>

            <Modal.Footer className="border-t border-default-200">
              <div className="flex w-full justify-end gap-2">
                <Button variant="outline" onPress={onClose}>
                  {config?.cancelText ?? "Cancel"}
                </Button>

                <Button variant="primary" onPress={handleConfirm}>
                  {config?.confirmText ?? "Confirm"}
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}