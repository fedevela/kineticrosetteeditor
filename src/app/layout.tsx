import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kinetic Rosette Editor",
  description:
    "Interactive editor for designing rosette slices, rotational symmetries, and tiling tessellations.",
  applicationName: "Kinetic Rosette Editor",
  keywords: ["rosette", "tessellation", "geometry", "editor", "symmetry", "kinetic patterns"],
  openGraph: {
    title: "Kinetic Rosette Editor",
    description:
      "Design and explore kinetic rosette patterns across slices, rosette, and tiling domains.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Kinetic Rosette Editor",
    description:
      "Interactive geometric editor for rosette slices and tessellation domains.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} app-root`}>
        {children}
      </body>
    </html>
  );
}
