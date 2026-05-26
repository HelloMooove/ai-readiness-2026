import Script from 'next/script';

// Public AI Readiness form. The form is a self-contained vanilla JS app
// living at /public/app.js that mounts itself into #app on load. The JSX
// here mirrors the original index.html exactly so app.js works unchanged.
export default function Home() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/styles.css" />

      <div className="bg-glow" aria-hidden="true"></div>
      <div className="bg-noise" aria-hidden="true"></div>

      <div className="container">
        <header className="banner" role="banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banner.png"
            alt="MOOOVE — Navigating the AI wave. MOOOVE | ALIGN | BUILD | SCALE."
          />
        </header>

        <main id="app" className="app" aria-live="polite"></main>
      </div>

      <div id="phase-flash" className="phase-flash" aria-hidden="true">
        <div className="phase-flash-inner">
          <span className="phase-flash-eyebrow"></span>
          <span className="phase-flash-title"></span>
        </div>
      </div>

      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
