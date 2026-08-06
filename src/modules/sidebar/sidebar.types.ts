export type SidebarItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  items?: SidebarItem[]
}
