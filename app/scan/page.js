// import ScanInput from "@/components/ScanInput";

// export default function ScanPage() {
//   return (
//     <main className="mx-auto max-w-2xl px-6 py-16">
//       <h1 className="text-2xl font-semibold tracking-tight">Scan a product</h1>
//       <p className="mt-2 text-[var(--text-dim)]">
//         Enter a barcode, upload a label photo, or both.
//       </p>
//       <div className="mt-10">
//         <ScanInput />
//       </div>
//     </main>
//   );
// }

import Link from "next/link";
import { Barcode, Camera, ShieldCheck } from "lucide-react";

const options = [
  { href: "/scan/barcode", icon: Barcode, title: "Scan Barcode", text: "Fast lookup against Open Food Facts. Best when you just want a quick check." },
  { href: "/scan/photo", icon: Camera, title: "Scan Label Photo", text: "Read nutrition facts directly off the packaging. Best for products without a barcode match." },
  { href: "/scan/verify", icon: ShieldCheck, title: "Verify Both", text: "Barcode + label photo together — cross-checks the two sources and flags any mismatch." },
];

export default function ScanPicker() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-medium tracking-tight">How would you like to scan?</h1>
      <div className="mt-8 grid gap-4">
        {options.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="flex items-start gap-4 rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] p-5 hover:border-[var(--accent)]">
            <Icon size={22} className="mt-1 text-[var(--accent)]" />
            <div>
              <p className="font-display font-medium">{title}</p>
              <p className="mt-1 text-sm text-[var(--ink-dim)]">{text}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}