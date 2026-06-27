import { Bell, LogOut, UserCircle, LayoutDashboard, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface TopBarProps {
  title: string
  isAdmin?: boolean
  onSwitch?: () => void
  onLogout?: () => void
  notificationCount?: number
}

export function TopBar({ title, isAdmin = false, onSwitch, onLogout, notificationCount = 0 }: TopBarProps) {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </Button>
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              {notificationCount > 9 ? "9+" : notificationCount}
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">
                  {isAdmin ? "管" : "用"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{isAdmin ? "管理员" : "用户"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{isAdmin ? "管理员" : "用户"}</span>
              <span className="text-xs text-muted-foreground">admin@example.com</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSwitch}>
              {isAdmin ? <User className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
              <span>切换到 {isAdmin ? "用户端" : "管理端"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserCircle className="w-4 h-4" />
              <span>个人设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
