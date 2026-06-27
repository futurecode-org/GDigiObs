import { useState } from "react"
import { CheckSquare, Square, Save, RefreshCw } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Btn } from "@/components/shared/Btn"
import { menuTree } from "@/lib/mockData"

interface MenuItem {
  key: string; label: string; checked: boolean; children?: MenuItem[]
}

export function PermissionsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(menuTree)
  const [selectedRole, setSelectedRole] = useState("数据分析员")

  const toggleCheck = (item: MenuItem, items: MenuItem[]): MenuItem[] => {
    return items.map(i => {
      if (i.key === item.key) {
        const newChecked = !i.checked
        const newItem: MenuItem = { ...i, checked: newChecked }
        if (i.children) {
          newItem.children = i.children.map(c => ({ ...c, checked: newChecked }))
        }
        return newItem
      }
      if (i.children) {
        return { ...i, children: toggleCheck(item, i.children) }
      }
      return i
    })
  }

  const handleToggle = (item: MenuItem) => {
    setMenuItems(prev => toggleCheck(item, prev))
  }

  const handleSave = () => {
    alert(`权限配置已保存，角色: ${selectedRole}`)
  }

  const renderMenuTree = (items: MenuItem[], depth: number = 0) => {
    return items.map(item => (
      <div key={item.key}>
        <div
          className="flex items-center gap-2 py-2 px-2 hover:bg-muted/30 rounded cursor-pointer transition-colors"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleToggle(item)}
        >
          {item.checked ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
          <span className="text-sm text-foreground">{item.label}</span>
        </div>
        {item.children && item.children.length > 0 && renderMenuTree(item.children, depth + 1)}
      </div>
    ))
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="权限管理" action={
          <div className="flex items-center gap-2">
            <Btn variant="outline" onClick={() => setMenuItems(menuTree)}><RefreshCw className="w-4 h-4" /> 重置</Btn>
            <Btn onClick={handleSave}><Save className="w-4 h-4" /> 保存</Btn>
          </div>
        } />
        <div className="mt-4">
          <label className="text-xs text-muted-foreground mr-2">选择角色</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="平台超级管理员">平台超级管理员</option>
            <option value="租户管理员">租户管理员</option>
            <option value="普通管理员">普通管理员</option>
            <option value="数据分析员">数据分析员</option>
            <option value="内容审核员">内容审核员</option>
            <option value="只读观察员">只读观察员</option>
          </select>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-border bg-muted/30">
          <span className="text-sm font-medium text-foreground">菜单权限配置</span>
        </div>
        <div className="p-4">
          {renderMenuTree(menuItems)}
        </div>
      </Card>
    </div>
  )
}