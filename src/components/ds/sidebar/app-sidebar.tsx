import * as React from "react"
import { NavMain } from "@/components/ds/sidebar/nav-main"
import { NavProjects } from "@/components/ds/sidebar/nav-projects"
import { NavUser } from "@/modules/auth/components"
import { LanguageSwitcher } from "@/modules/locales"
import { TeamSwitcher } from "@/components/ds/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ComputerTerminalIcon,
  RoboticIcon,
  BookOpen02Icon,
  Settings05Icon,
  CropIcon,
  PieChartIcon,
  MapsIcon,
} from "@hugeicons/core-free-icons"
import { appConfig } from "@/config/app.config"
import TeamWithoutSwitcher from "./team-without-switcher"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: <HugeiconsIcon icon={RoboticIcon} strokeWidth={2} />,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: <HugeiconsIcon icon={CropIcon} strokeWidth={2} />,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: <HugeiconsIcon icon={PieChartIcon} strokeWidth={2} />,
    },
    {
      name: "Travel",
      url: "#",
      icon: <HugeiconsIcon icon={MapsIcon} strokeWidth={2} />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {
          appConfig.team.allowSwitchingTeams ? 
          <TeamSwitcher teams={appConfig.team.teams} />
          : <TeamWithoutSwitcher team={appConfig.team.teams[0]} />
        }
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavProjects projects={data.projects} />
        <LanguageSwitcher />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
