import { useState } from "react"
import { Save, Globe, Shield, Clock, Server } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Btn } from "@/components/shared/Btn"
import { Toggle } from "@/components/shared/Toggle"

export function PlatformConfig() {
  const [config, setConfig] = useState({
    siteName: "数智瞭望系统",
    siteDesc: "智能数据采集与分析平台",
    allowRegister: true,
    allowExternalUsers: true,
    maxUploadSize: 50,
    sessionTimeout: 30,
    enableAudit: true,
    enableSensitiveCheck: true,
  })

  const handleSave = () => {
    alert("平台配置已保存")
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="平台配置" action={<Btn onClick={handleSave}><Save className="w-4 h-4" /> 保存配置</Btn>} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">基本设置</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">站点名称</label>
              <input
                type="text"
                value={config.siteName}
                onChange={e => setConfig({ ...config, siteName: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">站点描述</label>
              <input
                type="text"
                value={config.siteDesc}
                onChange={e => setConfig({ ...config, siteDesc: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">安全设置</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-foreground">允许新用户注册</div>
                <div className="text-xs text-muted-foreground">开启后允许未注册用户注册账号</div>
              </div>
              <Toggle on={config.allowRegister} onChange={() => setConfig({ ...config, allowRegister: !config.allowRegister })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-foreground">允许外部用户</div>
                <div className="text-xs text-muted-foreground">开启后允许非企业用户注册</div>
              </div>
              <Toggle on={config.allowExternalUsers} onChange={() => setConfig({ ...config, allowExternalUsers: !config.allowExternalUsers })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-foreground">启用审计日志</div>
                <div className="text-xs text-muted-foreground">记录所有操作和审计信息</div>
              </div>
              <Toggle on={config.enableAudit} onChange={() => setConfig({ ...config, enableAudit: !config.enableAudit })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-foreground">启用敏感词检测</div>
                <div className="text-xs text-muted-foreground">对消息内容进行敏感词过滤</div>
              </div>
              <Toggle on={config.enableSensitiveCheck} onChange={() => setConfig({ ...config, enableSensitiveCheck: !config.enableSensitiveCheck })} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">系统设置</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">最大上传文件大小 (MB)</label>
              <input
                type="number"
                value={config.maxUploadSize}
                onChange={e => setConfig({ ...config, maxUploadSize: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">会话设置</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">会话超时时间 (分钟)</label>
              <input
                type="number"
                value={config.sessionTimeout}
                onChange={e => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}