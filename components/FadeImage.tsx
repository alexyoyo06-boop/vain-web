"use client";

import Image, { type ImageProps } from "next/image";
import imageLoader from "@/lib/image-loader";
import { useState } from "react";

export default function FadeImage(props: ImageProps) {
  const { className, onLoad, priority, ...rest } = props;
  // Si la imagen tiene priority (LCP/above-the-fold) no fundimos para no retrasar la pintura.
  const [loaded, setLoaded] = useState(priority ?? false);

  return (
    <Image
      loader={imageLoader}
      {...rest}
      priority={priority}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      className={`${className ?? ""} transition-opacity duration-500 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
