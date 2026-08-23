"use client";

import Link from "next/link";

type FooterProps = {
  variant?: "dark" | "light";
};

// Site-wide internal links. The editorial pages live here so every page on the
// site links to them — otherwise they are orphans that only the sitemap knows about.
const FOOTER_LINKS = [
  { name: "About", href: "/about" },
  { name: "Letterboxd for Music", href: "/letterboxd-for-music" },
  { name: "Song Annotations", href: "/song-annotations" },
  { name: "Compare", href: "/alternatives" },
  { name: "Tracks", href: "/tracks" },
  { name: "Privacy", href: "/privacy" },
  { name: "Contact", href: "/contact" },
];

const Footer = ({ variant = "dark" }: FooterProps) => {
  const isDark = variant === "dark";

  const bgColor = isDark ? "bg-[#5C5537]" : "bg-[#FFFBEb]";
  const textColor = isDark ? "text-[#FFFBEb]/70" : "text-[#5C5537]/70";
  const hoverColor = isDark ? "hover:text-[#FFFBEb]" : "hover:text-[#5C5537]";
  const borderColor = isDark ? "border-[#FFFBEb]/20" : "border-[#5C5537]/20";

  return (
    <footer className={`px-6 py-8 relative ${bgColor} z-10 border-t ${borderColor}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className={`${textColor} text-sm`}>
            © {new Date().getFullYear()} Trackboxd. Made with love 🤎
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm"
          >
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${textColor} ${hoverColor} transition-colors duration-200`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
