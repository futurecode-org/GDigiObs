export function TeapotPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">418 I'm a teapot</h1>
        <img
          src="/img/418ImATeapot.png"
          alt="418 I'm a teapot"
          className="mx-auto rounded-lg shadow-lg max-w-full h-auto"
        />
        {/* <p className="text-base leading-relaxed text-muted-foreground">
          HTTP 状态码 418，也被称为“我是茶壶”错误码，是一种幽默的响应码，用于表示您尝试访问的服务器是一个茶壶，因此无法满足请求。该代码是一个玩笑，不应被认真对待。它是作为超文本咖啡壶控制协议（HTCPCP）的一部分而推出的，HTCPCP 是一种对 HTTP 协议的幻想扩展，于 1998 年作为愚人节的玩笑被创建。虽然这不是一个广泛使用的代码，但某些 Web 服务器仍可能会在响应某些请求时返回 418 响应码。
        </p> */}
      </div>
    </div>
  )
}
