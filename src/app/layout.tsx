import type { Metadata, Viewport } from "next";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { GlassLight } from "@/components/GlassLight";
import { ScrollState } from "@/components/ScrollState";

export const metadata: Metadata = {
  title: "Project Pickup · Build with Tufts students",
  description: "Post your app or website project, ask for one role, and team up with another Tufts student.",
  openGraph: {
    title: "Project Pickup · Build with Tufts students",
    description: "Post your project, name the role and the hours, and team up with another Tufts student.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#3E8EDE",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <GlassLight />
        <ScrollState />
      </body>
    </html>
  );
}
