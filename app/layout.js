export const metadata = {
  title: 'Amiya',
  description: 'Your relationship coach',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
