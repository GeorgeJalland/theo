"use client";

import { useRef } from "react";
import Image from "next/image";

export default function TheoHead() {
  const audioRef = useRef(null);

  const handleClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/praise_god.mp3");
    }

    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  return (
    <button onClick={handleClick} className="focus:outline-none">
      <Image
        priority
        height={400}
        width={400}
        src="/images/favicon.png"
        alt="theos head"
        className="w-40 h-auto cursor-pointer active:scale-95 transition"
      />
    </button>
  );
}