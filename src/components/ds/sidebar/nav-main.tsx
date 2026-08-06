import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { useTranslation } from "react-i18next"
import type { SidebarItem } from "@/modules/sidebar/sidebar.types"

export function NavMain({
  items,
  sectionTitle,
  className,
}: {
  items: SidebarItem[],
  sectionTitle: string
  className?: string
}) {
  const { t } = useTranslation("sidebar")
  return (
    <SidebarGroup className={className}>
      <SidebarGroupLabel>{t(sectionTitle)}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
            className="group/collapsible"
            render={<SidebarMenuItem />}
          >
            <CollapsibleTrigger
              render={<SidebarMenuButton tooltip={t(item.title)} />}
            >
              {item.icon}
              <span>{t(item.title)}</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton render={<a href={subItem.url} />}>
                      {subItem.icon}
                      <span>{t(subItem.title)}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
