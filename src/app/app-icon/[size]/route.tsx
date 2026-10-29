import { renderIcon } from "@/lib/icon-image";

// PWA manifest icons (see app/manifest.ts).
export async function GET(_req: Request, ctx: RouteContext<"/app-icon/[size]">) {
  const { size } = await ctx.params;
  return renderIcon(size === "512" ? 512 : 192);
}
