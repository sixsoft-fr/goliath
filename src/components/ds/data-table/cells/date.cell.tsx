import { useTranslation } from "react-i18next"
import { formatDateTime } from "@/lib/date"

interface DateCellProps {
  value: unknown
}

export function DateCell({ value }: DateCellProps) {
  const { i18n } = useTranslation()
  return <span>{formatDateTime(value, i18n.language)}</span>
}
