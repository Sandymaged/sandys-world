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
  // للوحة التحكم
  store: "M4 10 5.5 5h13L20 10M4 10v10h16V10M4 10h16M9 20v-5h6v5",
  box: "M4 8.5 12 4l8 4.5v8L12 21l-8-4.5v-8Zm0 0 8 4.5m0 0 8-4.5M12 13v8",
  layers: "m12 4 8 4-8 4-8-4 8-4Zm-8 8 8 4 8-4M4 16l8 4 8-4",
  sliders: "M4 7h9m4 0h3M4 17h3m4 0h9M15 5v4M9 15v4",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  external: "M14 4h6v6m0-6-9 9m7 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  logout: "M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3m7-4 4-4-4-4m4 4H9",
  chart: "M4 20h16M7 16v-5m5 5V7m5 9v-3",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
  route: "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9a3 3 0 0 1 3-3h4m5 3v6a3 3 0 0 1-3 3h-4",
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
