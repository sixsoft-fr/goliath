import { type FC, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ActionButtonProps {
  label: string
  tooltip: string
  onClick: () => void
  children: ReactNode
}

export const ActionButton: FC<ActionButtonProps> = ({
  label,
  tooltip,
  onClick,
  children,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            className="size-8"
            onClick={onClick}
            size="icon"
            variant="outline"
          >
            {children}
          </Button>
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
