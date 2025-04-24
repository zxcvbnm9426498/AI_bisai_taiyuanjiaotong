import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "智能城市交通预警系统",
  description: "实时监控和预警城市交通状况",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={`${inter.className} bg-[#020924] min-h-screen`} style={{ color: "#ffffff" }}>
        {children}
      </body>
    </html>
  );
}
