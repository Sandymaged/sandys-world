// أيقونات خطية موحدة (24×24، سُمك 1.75) عشان كل الموقع يبان من نفس العيلة

const paths = {
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4-4",
  bag: "M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2",
  home: "M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4v-9.5Z",
  grid: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",
  gift: "M4 9h16v4H4V9Zm1.5 4h13v7h-13v-7ZM12 9v11M12 9c-1.5-3.5-5.5-3.5-5.5-1.25S10 9 12 9Zm0 0c1.5-3.5 5.5-3.5 5.5-1.25S14 9 12 9Z",
  truck: "M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  camera: "M4 8h3l2-2.5h6L17 8h3v11H4V8Zm8 8.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  wallet: "M4 7h15v12H4V7Zm0 0 11-3v3m1 6.5h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4.5l3 2",
  chevron: "m14 6-6 6 6 6",
  check: "m5 12.5 4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  pin: "M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  pen: "m4 20 4.5-1L19 8.5 15.5 5 5 15.5 4 20Z",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={name === "chevron" ? `${className} ltr:-scale-x-100` : className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  );
}
