import PluginInit from "@/helper/PluginInit";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "react-hot-toast";
import "./font.css";
import "./globals.css";

export const metadata = {
  title: "WowDash NEXT JS - Admin Dashboard Multipurpose Bootstrap 5 Template",
  description:
    "Wowdash NEXT JS is a developer-friendly, ready-to-use admin template designed for building attractive, scalable, and high-performing web applications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <PluginInit />
      <body suppressHydrationWarning={true}>
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
