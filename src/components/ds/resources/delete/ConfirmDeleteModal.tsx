import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { type FC } from "react"
import { useTranslation } from "react-i18next"

interface ConfirmDeleteModalProps {
  resource: string;
  identifier: string;
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

export const ConfirmDeleteModal: FC<ConfirmDeleteModalProps> = ({ resource, isOpen, onClose, onDelete }) => {
  const { t } = useTranslation(resource);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delete.title")}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t("delete.description")}
        </DialogDescription>
        <DialogFooter>
          <Button onClick={onDelete}>{t("delete.button")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}