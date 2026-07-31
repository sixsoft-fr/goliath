import { HugeiconsIcon } from "@hugeicons/react"
import { Globe02Icon } from "@hugeicons/core-free-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Locales, type Locale } from "../locales.enum"
import { useLocaleStore } from "../store/locale.store"

// Languages are shown in their own native name, not translated.
const LABELS: Record<Locale, string> = {
  [Locales.FR]: "Français",
  [Locales.EN]: "English",
}

export function LanguageSwitcher() {
  const { isMobile } = useSidebar()
  const { locale, setLocale } = useLocaleStore()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                tooltip={LABELS[locale]}
                aria-label="Change language"
                className="aria-expanded:bg-muted"
              />
            }
          >
            <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />
            <span>{LABELS[locale]}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuRadioGroup
              value={locale}
              onValueChange={(value) => setLocale(value as Locale)}
            >
              {Object.values(Locales).map((code) => (
                <DropdownMenuRadioItem key={code} value={code}>
                  {LABELS[code]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
