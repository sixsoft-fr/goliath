import { AppSidebar } from "@/components/ds/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Outlet } from "react-router"
import { Page } from "@/modules/core/Page"

export default function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Page>
            <Outlet />
          </Page>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
