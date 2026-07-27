import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "이누야마 가족 여행 지도",
  description: "세 세대가 함께 걷고 쉬고 맛보는 이누야마 가이드"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
