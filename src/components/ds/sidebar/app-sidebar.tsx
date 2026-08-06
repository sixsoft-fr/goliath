import * as React from "react"
import { NavMain } from "@/components/ds/sidebar/nav-main"
import { NavUser } from "@/modules/auth/components"
import { NavNotifications } from "@/modules/notifications"
import { LanguageSwitcher } from "@/modules/locales"
import { TeamSwitcher } from "@/components/ds/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { appConfig } from "@/config/app.config"
import TeamWithoutSwitcher from "./team-without-switcher"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {appConfig.team.allowSwitchingTeams ? (
          <TeamSwitcher teams={appConfig.team.teams} />
        ) : (
          <TeamWithoutSwitcher team={appConfig.team.teams[0]} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={appConfig.sidebar.platform} sectionTitle="sidebar.platform.title" />
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={appConfig.sidebar.admin} sectionTitle="sidebar.admin.title" className="px-0" />
        <NavNotifications />
        <LanguageSwitcher />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
