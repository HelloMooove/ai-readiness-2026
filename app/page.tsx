import Script from 'next/script';

// Public AI Readiness form. Flat-Navy design with a live text banner (no image).
// The form itself is a self-contained vanilla JS app at /public/app.js that
// mounts into #app on load. Styling: styles.css (base) + navy-theme.css (flat
// Navy canvas + text banner).
export default function Home() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/styles.css" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/navy-theme.css" />

      <div className="container">
        <header className="banner banner-text" role="banner">
          <div className="hero-pill">
            <span className="hero-pill-icon" aria-hidden="true">✦</span>
            AI Readiness Starts Here
          </div>

          <h1 className="hero-wordmark">MOOOVE</h1>
          <p className="hero-tagline">Find your AI readiness score</p>
          <p className="hero-sub">
            Navigating the AI wave requires you to understand <em>where</em> you
            start from.
          </p>

          <div className="hero-pillars" aria-hidden="true">
            <span>MOOOVE</span>
            <i>|</i>
            <span>ALIGN</span>
            <i>|</i>
            <span>BUILD</span>
            <i>|</i>
            <span>SCALE</span>
          </div>
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
