import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UnfoldMoreIcon,
  SparklesIcon,
  CheckmarkBadgeIcon,
  CreditCardIcon,
  NotificationIcon,
  LogoutIcon,
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/modules/auth/auth.context"
import { useNavigate } from "react-router"
import { api } from "@/lib/api"

export function NavUser() {
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    // Invalide le cookie de refresh httpOnly côté serveur, sinon un reload
    // pourrait restaurer la session via attemptSilentRefresh. Fire-and-forget :
    // navigate() est client-side, la requête n'est donc pas annulée.
    api.delete("auth").catch(() => {});
    logout();
    navigate("/login");
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              strokeWidth={2}
              className="ml-auto size-4"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <HugeiconsIcon icon={CheckmarkBadgeIcon} strokeWidth={2} />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
