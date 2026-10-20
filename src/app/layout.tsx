import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { NavigationShell } from "@/components/navigation-shell";

export const metadata: Metadata = {
  title: "AFTERMATH — The Release Time Machine",
  description:
    "Every release has consequences. See them before production. Built for GitLab Life After Code Hackathon.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FDFBF7] text-[#0F172A]">
        <Providers>
          <NavigationShell>{children}</NavigationShell>
        </Providers>
      </body>
    </html>
  );
}
