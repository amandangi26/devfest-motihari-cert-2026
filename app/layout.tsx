import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevFest Ranchi 2026 - Certificate Portal",
  description: "Download your official DevFest Ranchi 2026 Certificate of Participation verified by Google Developer Groups Ranchi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[#FFFBF0] text-[#111111]">
        {children}
      </body>
    </html>
  );
}
