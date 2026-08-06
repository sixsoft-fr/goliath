import type { SidebarItem } from "./sidebar.types"
import { HugeiconsIcon } from "@hugeicons/react"
import { Users } from "@hugeicons/core-free-icons"

export type SidebarConfig = {
  admin: SidebarItem[]
  platform: SidebarItem[]
}

export const sidebarConfig: SidebarConfig = {
  admin: [
    {
      title: "sidebar.admin.users-menu",
      url: "#",
      icon: <HugeiconsIcon icon={Users} strokeWidth={2} />,
      items: [
        {
          title: "sidebar.admin.users",
          icon: <HugeiconsIcon icon={Users} strokeWidth={2} />,
          url: "/admin/users",
        },
      ]
    }
  ],
  platform: [],
}
