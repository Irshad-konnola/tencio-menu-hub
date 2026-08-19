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

export const metadata = {
  metadataBase: new URL("https://tencio-menu-hub.vercel.app"),
  title: "Tencio Menu Hub | Smart Digital Menus & Table Service",
  description: "The ultimate digital menu and smart table service platform. Browse digital menus, call the waiter instantly, and let cafe owners manage operations seamlessly.",
  openGraph: {
    title: "Tencio Menu Hub",
    description: "The ultimate digital menu and smart table service platform for modern cafes and restaurants.",
    url: "https://tencio-menu-hub.vercel.app",
    siteName: "Tencio Menu Hub",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tencio Menu Hub",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tencio Menu Hub",
    description: "Smart Digital Menus & Table Service platform.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
