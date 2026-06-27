export function PlaceholderPage({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ElementType }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{desc}</p>
        </div>
      </div>
    </div>
  )
}