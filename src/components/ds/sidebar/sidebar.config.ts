import type { SidebarItem } from "./sidebar.types";

export type SidebarConfig = {
    admin: SidebarItem[]
    platform: SidebarItem[]
}

export const sidebarConfig: SidebarConfig = {
    admin: [],
    platform: [],
}