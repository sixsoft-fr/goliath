import { HugeiconsIcon } from "@hugeicons/react"
import { Globe02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Locales, type Locale } from "../locales.enum"
import { useLocaleStore } from "../store/locale.store"

// Languages are shown in their own native name, not translated.
const LABELS: Record<Locale, string> = {
  [Locales.FR]: "Français",
  [Locales.EN]: "English",
}

// Standalone language picker for contexts outside the sidebar (auth pages, etc.).
// Cf. LanguageSwitcher for the sidebar-bound variant.
export function LocaleMenu() {
  const { locale, setLocale } = useLocaleStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label="Change language"
            data-icon="inline-start"
          />
        }
      >
        <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />
        <span>{LABELS[locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4}>
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
  )
}
