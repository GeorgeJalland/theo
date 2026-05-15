"use client"

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
    {title: "Quotes", url:"/quotes"},
    {title: "Episodes", url:"/episodes"},
    {title: "Clips", url:"/clips"},
    {title: "About Us", url:"/about-us"},
]

export default function MenuDropdown() {
    const [open, setOpen] = useState(false)
    const [hoveredItem, setHoveredItem] = useState(null);

    const pathname = usePathname();
    
    return (
        <div className="relative z-50">
            <Image
            priority 
            alt="menu button"
            src="/images/menu_icon_2.png"
            width={64}
            height={64}
            className="w-20 h-full invert cursor-pointer"
            onClick={() => setOpen(!open)}
            />

            {open && (
                <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setOpen(false)}
                />
            )}

            <div
            className={`
                absolute top-full right-0 backdrop-blur-md
                text-5xl p-3 flex flex-col gap-2
                border border-white/30 bg-black/10
                z-50
                rounded-xl [text-shadow:none]
                transform origin-top transition-all duration-200 ease-out
                ${open
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" 
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}
            `}
            >
                {menuItems.map(item => {
                    const isActive = pathname === item.url;
                    const isHovered = hoveredItem === item.url;

                    const showActiveBackground =
                        isActive && !hoveredItem;

                    return (
                        <Link
                        key={item.title}
                        href={item.url}
                        onClick={() => setOpen(false)}
                        >
                            <div
                            onMouseEnter={() => setHoveredItem(item.url)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={`
                                rounded-xl p-2 w-80 transition-colors
                                ${
                                    isHovered || showActiveBackground
                                        ? "bg-gray-500"
                                        : "hover:bg-gray-500"
                                }
                            `}
                            >
                                {item.title}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}