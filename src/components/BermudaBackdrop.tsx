import mapBg from "@/assets/bermuda-map.jpg";

/**
 * Global atmospheric backdrop for BARMUDA CLASH.
 * A very subtle Bermuda-region map behind soft blue gradient washes, fixed so
 * it continues naturally while scrolling. Purely decorative.
 */
export function BermudaBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <img
        src={mapBg}
        alt=""
        width={1536}
        height={1536}
        className="absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 object-cover opacity-70"
      />
      <div className="absolute -left-[20vw] -top-[15vh] size-[70vmax] rounded-full bg-primary/10 blur-[140px]" />
      <div className="absolute -right-[25vw] top-1/3 size-[60vmax] rounded-full bg-primary/[0.07] blur-[150px]" />
      <div className="absolute inset-x-0 bottom-0 h-[45vh] bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
