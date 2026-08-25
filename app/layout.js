import "./globals.css";

export const metadata = {
  title: "LabelSense",
  description: "Scan a barcode or a label. Get an explainable nutrition score.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        {children}
      </body>
    </html>
  );
}
