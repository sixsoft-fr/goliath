import { useTranslation } from "react-i18next"

export interface StatusCellProps {
    value?: string
    ns?: string
}
  
export function StatusCell({ value, ns }: StatusCellProps) {
    const { t } = useTranslation(ns ?? undefined)
    if (!value) return <span className="text-muted-foreground">—</span>
    return <span>{t(`values.status.${value}`, { defaultValue: value })}</span>
}   