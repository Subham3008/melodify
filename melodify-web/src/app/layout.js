import "./globals.css";

import AppProviders from "@/presentation/providers/AppProviders";

export const metadata = {
  title: "Melodify",
  description:
    "A modern music streaming platform",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}