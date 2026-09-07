import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "تقویم محتوایی شمسی",
  description: "تقویم جلالی متصل به Notion",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}