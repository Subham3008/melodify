import "./globals.css";

import AppProviders from "@/presentation/providers/AppProviders";

export const metadata = {
  title: "Melodify",
  description:
    "A modern music streaming platform",
};

export default function RootLayout({
  children,
  modal,
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
          {modal}
        </AppProviders>
      </body>
    </html>
  );
}