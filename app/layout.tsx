import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "YouTrack Scope Discovery",
  description: "Phase-one contract shell for YouTrack scope discovery.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Georgia, 'Times New Roman', serif",
          background:
            "radial-gradient(circle at top, #f7efe2 0%, #efe2cc 40%, #ddd0b8 100%)",
          color: "#1f1300",
        }}
      >
        {children}
      </body>
    </html>
  );
}
