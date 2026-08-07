import type { SidebarItem } from "./sidebar.types"
import { HugeiconsIcon } from "@hugeicons/react"
import { Users, ShoppingCart } from "@hugeicons/core-free-icons"

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
    },
    {
      title: "sidebar.admin.products-menu",
      url: "#",
      icon: <HugeiconsIcon icon={ShoppingCart} strokeWidth={2} />,
      items: [
        {
          title: "sidebar.admin.products",
          url: "/app/products",
          icon: <HugeiconsIcon icon={ShoppingCart} strokeWidth={2} />,
        },
        {
          title: "sidebar.admin.referentials",
          url: "/app/referentials",
          icon: <HugeiconsIcon icon={ShoppingCart} strokeWidth={2} />,
        },
      ]
    }
  ],
  platform: [],
}
