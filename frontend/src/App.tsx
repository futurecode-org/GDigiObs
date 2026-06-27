import { useState } from "react"
import { AdminApp } from "./apps/admin/AdminApp"
import { UserApp } from "./apps/user/UserApp"

type AppView = "admin" | "user"

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("user")

  return (
    <div className="h-screen">
      {currentView === "admin" ? (
        <AdminApp onSwitch={() => setCurrentView("user")} />
      ) : (
        <UserApp onSwitch={() => setCurrentView("admin")} />
      )}
    </div>
  )
}
