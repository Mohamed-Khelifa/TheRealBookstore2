import React, { ReactNode, useState } from "react";

interface GlassVideoBackgroundProps {
  children?: ReactNode;
  className?: string;
}

export const GlassVideoBackground = ({ children, className = "" }: GlassVideoBackgroundProps) => {
  const [hasError, setHasError] = useState(false);
  const VIDEO_URL =
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4";

  return (
    <>
      {/* Video Background */}
      <div className="fixed top-0 left-0 w-full h-[100dvh] z-0 pointer-events-none overflow-hidden bg-ink">
        {!hasError && (
          <video
            autoPlay
            loop
            muted
            playsInline
            onError={() => setHasError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={VIDEO_URL} type="video/mp4" />
          </video>
        )}
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-ink/70 dark:bg-ink/80 mix-blend-multiply" />
      </div>

      <section
        className={`relative z-10 w-full min-h-screen flex flex-col ${className}`}
      >
        {children}
      </section>
    </>
  );
};
