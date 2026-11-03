import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GDG CLOUD MOTIHARI - Certificate Portal",
  description: "Download and verify your official Certificate of Participation from GDG CLOUD MOTIHARI.",
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
