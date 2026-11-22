import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Mesmo desenho do app/icon.svg, sem cantos arredondados (o iOS aplica a máscara).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#14284a"/><path d="M10.5 24.5V7.5h6.25a5.25 5.25 0 0 1 0 10.5H10.5" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23.5" cy="23" r="3" fill="#a6e81c"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
        width={180}
        height={180}
        alt=""
      />
    ),
    size
  );
}
