'use client';
import React from 'react';
import { Button, Modal } from '@heroui/react';
import KnowLedgeReview from './knowledge-review';
import ModalProp from './modalProp';


export default function KnowledgeModal({isOpen, onOpenChange}: ModalProp) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      {/* <Button
        variant="primary"
        className="rounded-full border border-slate-200 bg-white px-6 text-slate-700 shadow-sm hover:border-blue-400 hover:text-blue-600"
        // onPress={() => router.push("/pages/knowledge-review")}
        onPress={() => setIsOpen(true)}
      >
        📋 Knowledge Review
      </Button> */}
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
              <KnowLedgeReview />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
