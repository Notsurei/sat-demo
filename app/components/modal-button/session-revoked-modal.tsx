"use client";

import { ShieldExclamation } from "@gravity-ui/icons";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";

type SessionRevokedModalProps = {
  open: boolean;
  onConfirm: () => void;
};

export default function SessionRevokedModal({
  open,
  onConfirm,
}: SessionRevokedModalProps) {
  const t = useTranslations("auth.signIn");

  return (
    <Modal isOpen={open}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.Header>
              <Modal.Icon className="bg-danger/10 text-danger">
                <ShieldExclamation className="size-5" />
              </Modal.Icon>

              <Modal.Heading>{t("signInSomewhere")}</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <p className="text-sm leading-6 text-default-500">
                {t("signInFromAnotherDevice")}
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Button className="w-full" variant="primary" onPress={onConfirm}>
                {t("signInAgain")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
