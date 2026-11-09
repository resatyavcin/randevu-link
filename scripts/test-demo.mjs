import { build } from "esbuild"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const directory = await mkdtemp(join(tmpdir(), "salon-demo-test-"))
try {
  const outfile = join(directory, "demo.test.mjs")
  await build({ entryPoints: ["src/infrastructure/demo/backend.test.ts"], outfile, bundle: true, platform: "node", format: "esm", tsconfig: "tsconfig.json" })
  const result = spawnSync(process.execPath, ["--test", outfile], { stdio: "inherit" })
  process.exitCode = result.status ?? 1
} finally {
  await rm(directory, { recursive: true, force: true })
}
