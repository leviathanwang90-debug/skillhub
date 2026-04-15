import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SkillHub',
  description: 'Discover, share, and manage skills',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://lf-package-cn.feishucdn.com/obj/feishu-static/lark/passport/qrcode/LarkSSOSDKWebQRCode-1.0.3.js" defer />
        <script src="https://sf-unpkg-src.bytedance.net/open/jssdk/jssdk-1.5.1.js" defer />
      </head>
      <body className="bg-dots min-h-screen">
        {children}
      </body>
    </html>
  )
}
