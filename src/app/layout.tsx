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
  title: "Foto Kita Mulai Blur",
  description:
    "Website gesture camera estetik dengan background YouTube, blur otomatis saat peace gesture terdeteksi, dan pengalaman audio interaktif.",
  keywords: [
    "Foto Kita Mulai Blur",
    "gesture peace",
    "kamera live",
    "blur foto",
    "YouTube background",
    "Sal Priadi",
    "website estetik",
  ],
  authors: [{ name: "Aldino Wildhanku" }],
  openGraph: {
    title: "Foto Kita Mulai Blur",
    description:
      "Website gesture camera estetik dengan background YouTube, blur otomatis saat peace gesture terdeteksi, dan pengalaman audio interaktif.",
    type: "website",
    siteName: "Foto Kita Mulai Blur",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foto Kita Mulai Blur",
    description:
      "Website gesture camera estetik dengan background YouTube, blur otomatis saat peace gesture terdeteksi, dan pengalaman audio interaktif.",
  },
  icons: [
    {
      rel: "icon",
      url: "https://cloud.sentrisit.web.id/apps/files_sharing/publicpreview/7XXEBwnLopykbbk?file=/&fileId=126&x=3360&y=2100&a=true&etag=3771faa22e8399ef621f12749dc6f043",
    },
    {
      rel: "shortcut icon",
      url: "https://cloud.sentrisit.web.id/apps/files_sharing/publicpreview/7XXEBwnLopykbbk?file=/&fileId=126&x=3360&y=2100&a=true&etag=3771faa22e8399ef621f12749dc6f043",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
