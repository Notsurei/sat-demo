"use client";
import React from "react";
import ModalProp from "./modalProp";
import { Modal } from "@heroui/react";
import ReferenceSheet from "./reference-sheet";

export default function ReferenceSheetModal({
  isOpen,
  onOpenChange,
}: ModalProp) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-[95vw] w-full h-[90vh] flex flex-col">
            <Modal.CloseTrigger />
            <Modal.Header>
              {/* <Modal.Heading className="flex items-center gap-2">
                <Books className="inline-block" />
                <span>Knowledge Review</span>
              </Modal.Heading> */}
            </Modal.Header>
            <Modal.Body className="p-0 flex-1 overflow-hidden">
              <ReferenceSheet />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
