import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CircuFi — Rotate money. Build trust. Never lose either.',
  description: 'CircuFi digitizes your ajo savings circle with transparent records and portable payment history.',
  keywords: ['ajo', 'esusu', 'savings circle', 'rotating savings', 'Nigeria', 'fintech'],
  openGraph: {
    title: 'CircuFi',
    description: 'Rotate money. Build trust. Never lose either.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en">
      <body>{children}</body>
      </html>
  )
}