import MusicShell from "@/presentation/components/layout/MusicShell";

export default function MusicLayout({
  children,
}) {
  return (
    <MusicShell>
      {children}
    </MusicShell>
  );
}