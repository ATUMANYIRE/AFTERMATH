import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { NavigationShell } from "@/components/navigation-shell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AFTERMATH — The Release Time Machine",
  description:
    "See what could happen to your release before it reaches production.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased min-h-screen bg-[#F8F9FB] text-[#191C24]`}>
        <Providers>
          <NavigationShell>{children}</NavigationShell>
        </Providers>
      </body>
    </html>
  );
}
