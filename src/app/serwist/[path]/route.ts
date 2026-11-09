import { spawnSync } from "node:child_process"
import { createSerwistRoute } from "@serwist/turbopack"

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID()

const serwistRoute = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
})

export const { dynamic, dynamicParams, revalidate, generateStaticParams } =
  serwistRoute

export const GET: typeof serwistRoute.GET = async (request, context) => {
  const response = await serwistRoute.GET(request, context)
  response.headers.set(
    "Cache-Control",
    "no-cache, no-store, must-revalidate, max-age=0"
  )
  return response
}
