"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Props {
  /** Public paths, in rotation order. A single image simply never rotates. */
  images: string[];
  /** Seconds each image is held before crossfading. */
  intervalSeconds?: number;
  /** How strongly the image shows through. Low by design — text sits on top. */
  opacityClassName?: string;
}

/**
 * Faded photography behind a hero.
 *
 * Rotation is paused entirely for anyone who prefers reduced motion, and for
 * them only the first image is shown — a slow crossfade is still motion.
 * The scrim above the image is what keeps the headline readable, so it is part
 * of this component rather than left to each page to remember.
 */
export default function HeroBackdrop({
  images,
  intervalSeconds = 7,
  opacityClassName = "opacity-[0.18] dark:opacity-[0.22]",
}: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      intervalSeconds * 1000
    );
    return () => clearInterval(id);
  }, [images.length, intervalSeconds]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          // The meaningful part of each photo is framed centrally, so the crop
          // stays centred as the viewport narrows.
          className={`object-cover object-center transition-opacity duration-[2000ms] ease-in-out ${
            i === index ? opacityClassName : "opacity-0"
          }`}
          sizes="100vw"
          priority={i === 0}
          quality={70}
        />
      ))}

      {/* Scrim: keeps text at full contrast over any photo, and fades the image
          into the page rather than ending on a hard edge. */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/80 to-white dark:from-[#030A17]/70 dark:via-[#030A17]/85 dark:to-[#030A17]" />
    </div>
  );
}
