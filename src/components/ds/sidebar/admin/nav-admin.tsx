import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MoreHorizontalCircle01Icon,
  FolderIcon,
  ArrowRightIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

export function NavAdmin() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
    </SidebarGroup>
  )
}
