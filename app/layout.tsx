import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  metadataBase: new URL('https://platform.disruptasia.today'),
  title: "Disrupt Puzzle | Collaborative Puzzle Game",
  description: "Scan QR codes, play mini-games, and contribute to a collaborative puzzle experience at Asia's premier startup conference",
  generator: 'Next.js',
  applicationName: 'Disrupt Puzzle',
  authors: [{ name: 'Disrupt Asia Team' }],
  keywords: ['Disrupt Asia', 'Puzzle Game', 'Collaborative', 'QR Codes', 'Technology', 'Innovation', 'Asia'],
  robots: 'index, follow',
  icons: {
    icon: '/logos/logo-02.png',
    apple: '/logos/logo-02.png',
  },
  openGraph: {
    title: 'Disrupt Puzzle | Collaborative Game',
    description: "Scan QR codes, play mini-games, and contribute to a collaborative puzzle experience at Asia's premier startup conference",
    url: 'https://platform.disruptasia.today',
    siteName: 'Disrupt Asia',
    images: [
      {
        url: '/logos/logo-02.png',
        width: 1200,
        height: 630,
        alt: 'Disrupt Puzzle Game',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Disrupt Puzzle | Collaborative Puzzle Game',
    description: "Scan QR codes, play mini-games, and contribute to a collaborative puzzle experience at Asia's premier startup conference",
    images: ['/logos/logo-02.png'],
  },
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Disrupt Puzzle',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-gradient-to-br from-cyan-100 via-white to-orange-100 min-h-screen`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
