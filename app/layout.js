import "./globals.css";
import { Space_Grotesk, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Public_Sans({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata = {
  title: "LabelSense",
  description: "Scan a barcode or a label. Get an explainable nutrition score.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}