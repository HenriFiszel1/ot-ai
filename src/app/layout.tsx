import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Optimize AI — Predict your grade before it matters",
  description:
    "Get teacher-specific, school-specific essay feedback with a predicted grade. Trained on real grading patterns.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased" style={{ background: '#141414', color: '#F2F2FF', fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
