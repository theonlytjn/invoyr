import { ImageResponse } from "next/og";

// Site-wide social share image (Open Graph + Twitter). 1200x630 is the
// universal link-preview size — renders sharp on WhatsApp, iMessage, Slack,
// LinkedIn, Facebook and X. Generated from the brand assets so there is no
// binary to keep in sync.
export const alt = "Invoyr — Get paid faster. Invoicing that runs itself.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Official Next.js pattern for using a Google font inside ImageResponse.
async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (resource) {
    const res = await fetch(resource[1]);
    if (res.ok) return await res.arrayBuffer();
  }
  throw new Error("failed to load font");
}

export default async function OpengraphImage() {
  const tagline = "Get paid faster.Invoicing that runs itself.invoyr.io";
  const serif = await loadGoogleFont("Instrument+Serif", tagline);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(1000px 500px at 18% 0%, rgba(52,211,153,0.20), transparent 60%)",
          color: "#fafafa",
        }}
      >
        {/* Wordmark (inlined vector — no font dependency) */}
        <svg width="300" height="128" viewBox="0 0 168.15 71.46" fill="#fafafa">
          <path d="M12.69,0v12.69H0V0h12.69ZM12.69,15.86v39.66H0V15.86h12.69Z" />
          <path d="M28.55,15.86v2.3c.69-1,1.59-1.75,2.7-2.22,1.11-.48,2.51-.71,4.2-.71,4.92,0,7.38,2.59,7.38,7.77v32.52h-12.69v-22.76c0-2.27-.04-3.75-.12-4.44-.08-.69-.28-1.03-.59-1.03s-.53.21-.63.63c-.11.42-.17,1.28-.2,2.58-.03,1.3-.04,2.89-.04,4.8v20.23h-12.69V15.86h12.69Z" />
          <path d="M48.38,55.52l-2.38-39.66h12.69l1.67,28.16h.63l1.67-28.16h12.69l-2.38,39.66h-24.59Z" />
          <path d="M82.05,17.85c2.25-2.06,5.54-3.09,9.87-3.09,8.78,0,13.3,4.02,13.56,12.06v17.77c-.26,8.04-4.79,12.06-13.56,12.06-4.34,0-7.63-1.03-9.87-3.09-2.25-2.06-3.42-5.05-3.53-8.96v-17.77c.11-3.91,1.28-6.9,3.53-8.96ZM91.45,43.11c.16.29.34.44.56.44s.4-.14.55-.44c.16-.29.24-.67.24-1.15v-13.01c0-.74-.27-1.11-.79-1.11s-.79.37-.79,1.11v13.01c0,.48.08.86.24,1.15Z" />
          <path d="M127.86,67.78c-4.71,2.46-10.13,3.69-16.26,3.69v-12.69c8.09,0,12.14-1.08,12.14-3.25h-12.69l-2.38-39.66h12.69l1.67,28.16h.63l1.67-28.16h12.69l-2.38,39.66c-.48,5.71-3.07,9.8-7.77,12.25Z" />
          <path d="M153.87,15.86v2.3c.69-1,1.59-1.75,2.7-2.22,1.11-.48,2.51-.71,4.2-.71,4.92,0,7.38,2.59,7.38,7.77v11.98h-12.69v-2.22c0-2.27-.04-3.75-.12-4.44-.08-.69-.28-1.03-.59-1.03s-.53.21-.63.63c-.11.42-.17,1.28-.2,2.58-.03,1.3-.04,2.89-.04,4.8v20.23h-12.69V15.86h12.69Z" />
        </svg>

        {/* Tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Instrument Serif", fontSize: 104, lineHeight: 1, color: "#fafafa" }}>
            Get paid faster.
          </div>
          <div style={{ fontFamily: "Instrument Serif", fontSize: 104, lineHeight: 1.05, color: "#a3a3a3" }}>
            Invoicing that runs itself.
          </div>
        </div>

        {/* Footer / url */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: "#34d399" }} />
          <div style={{ fontFamily: "Instrument Serif", fontSize: 34, color: "#d4d4d4" }}>invoyr.io</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Instrument Serif", data: serif, style: "normal", weight: 400 }],
    }
  );
}
