import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Optimize Teacher AI — Know your grade before you turn it in",
  description:
    "Get teacher-specific, school-specific essay feedback with a predicted grade. Trained on real grading patterns.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-gray-950">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
