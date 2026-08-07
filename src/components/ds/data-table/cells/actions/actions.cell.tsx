import { type FC } from "react"
import { Eye, Pencil, Trash2, Play, RotateCcw } from "lucide-react"
import { useNavigate } from "react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useSubject, type DynamicModel } from "@/modules/core"
import type { Row } from "@tanstack/react-table"
import { ActionButton } from "./action-button"

interface ActionsCellProps {
  row: Row<DynamicModel<unknown>>
  isViewable?: boolean
  isEditable?: boolean
  isDeletable?: boolean
  isPlayable?: boolean
  isRerunnable?: boolean
  onEdit?: (row: Row<DynamicModel<unknown>>) => void
  onDelete?: (row: Row<DynamicModel<unknown>>) => void
  onPlay?: (row: Row<DynamicModel<unknown>>) => void
  onRerun?: (row: Row<DynamicModel<unknown>>) => void
}

export const ActionsCell: FC<ActionsCellProps> = ({
  row,
  isViewable = true,
  isEditable = false,
  isDeletable = false,
  isPlayable = false,
  isRerunnable = false,
  onEdit,
  onDelete,
  onPlay,
  onRerun,
}) => {
  const { resource } = useSubject()
  const navigate = useNavigate()

  return (
    <TooltipProvider>
      <div
        key={`${resource}.${row.original.uuid}.actions`}
        className="flex items-center justify-end gap-1"
        // Buttons live inside a clickable row — don't trigger the row's navigate.
        onClick={(e) => e.stopPropagation()}
      >
        {isViewable && (
          <ActionButton
            label="View"
            tooltip="View"
            onClick={() =>
              navigate(`/app/${resource}/${row.original.uuid ?? ""}`)
            }
          >
            <Eye className="size-4" />
          </ActionButton>
        )}
        {isEditable && onEdit && (
          <ActionButton label="Edit" tooltip="Edit" onClick={() => onEdit(row)}>
            <Pencil className="size-4" />
          </ActionButton>
        )}
        {/* A row is either playable or rerunnable, never both. Rerun wins. */}
        {isRerunnable && onRerun ? (
          <ActionButton
            label="Rerun"
            tooltip="Play again"
            onClick={() => onRerun(row)}
          >
            <RotateCcw className="size-4" />
          </ActionButton>
        ) : (
          isPlayable &&
          onPlay && (
            <ActionButton
              label="Play"
              tooltip="Play"
              onClick={() => onPlay(row)}
            >
              <Play className="size-4" />
            </ActionButton>
          )
        )}
        {isDeletable && onDelete && (
          <ActionButton
            label="Delete"
            tooltip="Delete"
            onClick={() => onDelete(row)}
          >
            <Trash2 className="size-4 text-destructive" />
          </ActionButton>
        )}
      </div>
    </TooltipProvider>
  )
}
