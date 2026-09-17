export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-105 flex-col px-6 py-10">
        {/* Melodify Logo */}
        <div className="mb-7 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-black text-black">
            M
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 text-sm text-neutral-400">{subtitle}</p>
          )}
        </div>

        {children}
      </div>
    </main>
  );
}
