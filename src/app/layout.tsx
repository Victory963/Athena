import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Athena",
  description: "A personal defensive Dot. Closed actuators, human gate, kill switch. It does not take over the machine.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  );
}
