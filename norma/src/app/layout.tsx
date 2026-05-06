import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Norma — Sistema Jurídico',
  description: 'Sistema de gestão jurídica profissional',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrains.variable} ${playfair.variable} h-full`}>
      <head>
        {/* Anti-flash: aplica tema antes da hidratação */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('norma_theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 15, 15, 0.92)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
