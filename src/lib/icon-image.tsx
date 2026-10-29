import { ImageResponse } from "next/og";

/** App icon: white heart with a pulse line on teal, full-bleed for iOS. */
export function renderIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f766e",
        }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
          <path
            d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3.2 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.7 0 5.7 3.9 4.4 7.2C19.5 16.4 12 21 12 21z"
            fill="#ffffff"
          />
          <path
            d="M4.5 12h4l1.5-3 2.5 6 1.5-3h5.5"
            fill="none"
            stroke="#0f766e"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
