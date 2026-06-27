import { useState, useEffect } from "react";
import { Bell, LogOut, UserCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../lib/auth";
import { notificationApi } from "../../lib/api";

interface TopBarProps {
  title: string;
  onNotificationClick?: () => void;
}

export function TopBar({ title, onNotificationClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        setNotificationCount(count);
      } catch {
        setNotificationCount(0);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const displayName = user?.nickname || user?.username || "用户";
  const initial = displayName.charAt(0);

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={onNotificationClick}>
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
                  {initial}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{displayName}</span>
              <span className="text-xs text-muted-foreground">{user?.email || "-"}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="w-4 h-4" />
              <span>个人设置</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserCircle className="w-4 h-4" />
              <span>个人资料</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}