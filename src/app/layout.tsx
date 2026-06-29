import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, DM_Sans, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant", subsets: ["latin"],
  weight: ["400", "600", "700"], style: ["normal", "italic"],
});
const dmSans = DM_Sans({ variable: "--font-dm", subsets: ["latin"], weight: ["300", "400", "500"] });
const newsreader = Newsreader({
  variable: "--font-newsreader", subsets: ["latin"],
  weight: ["300", "400", "500"], style: ["normal", "italic"], display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono", subsets: ["latin"],
  weight: ["400", "500"], display: "swap",
});

export const metadata: Metadata = {
  title: "Bharat's (Anti)Library",
  description: "A personal library of 700+ books — read, unread, and everything in between.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${dmSans.variable} ${newsreader.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
