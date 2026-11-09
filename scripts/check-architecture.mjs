import { readdirSync, readFileSync, existsSync } from "node:fs"
import { resolve, relative, dirname, extname } from "node:path"
import ts from "typescript"

const root = resolve("src")
const allowed = {
  domain: ["domain"],
  application: ["application", "domain"],
  infrastructure: ["infrastructure", "application", "domain"],
  presentation: ["presentation", "application", "domain", "composition"],
  composition: ["composition", "infrastructure", "application", "domain", "presentation"],
  app: ["app", "presentation", "composition", "application", "domain"],
}
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)],
)
const files = walk(root).filter((file) => /\.tsx?$/.test(file) && !file.endsWith(".test.ts"))
const errors = []
const graph = new Map()
for (const file of files) {
  const name = relative(root, file)
  const layer = name.split("/")[0]
  if (!allowed[layer]) {
    errors.push(`${name}: unknown architecture layer`)
    continue
  }
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true)
  const imports = []
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      imports.push(node.moduleSpecifier.text)
    }
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === "require")) {
      if (node.arguments[0] && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text)
      else errors.push(`${name}: computed module loading cannot be checked`)
    }
    if (["domain", "application"].includes(layer) && ts.isIdentifier(node) && ["window", "document", "localStorage", "sessionStorage", "fetch", "process"].includes(node.text)) {
      errors.push(`${name}: ${node.text} belongs in an outer layer`)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  const edges = []
  for (const specifier of imports) {
    if (!specifier.startsWith("@/") && !specifier.startsWith(".")) {
      if (["domain", "application"].includes(layer)) errors.push(`${name}: external dependency ${specifier}`)
      continue
    }
    const base = specifier.startsWith("@/") ? resolve(root, specifier.slice(2)) : resolve(dirname(file), specifier)
    const dependency = [base + ".ts", base + ".tsx", resolve(base, "index.ts"), resolve(base, "index.tsx"), base].find(existsSync)
    if (!dependency) { errors.push(`${name}: missing import ${specifier}`); continue }
    const targetLayer = relative(root, dependency).split("/")[0]
    if (!allowed[layer].includes(targetLayer)) errors.push(`${name}: ${layer} cannot import ${targetLayer} (${specifier})`)
    if ([".ts", ".tsx"].includes(extname(dependency))) edges.push(dependency)
  }
  graph.set(file, edges)
}
const visited = new Set()
const active = new Set()
function checkCycle(file, trail = []) {
  if (active.has(file)) { errors.push(`Dependency cycle: ${[...trail, file].map((item) => relative(root, item)).join(" -> ")}`); return }
  if (visited.has(file)) return
  active.add(file)
  for (const dependency of graph.get(file) ?? []) checkCycle(dependency, [...trail, file])
  active.delete(file)
  visited.add(file)
}
for (const file of files) checkCycle(file)
if (errors.length) {
  console.error(errors.join("\n"))
  process.exitCode = 1
} else {
  console.log(`Architecture OK: ${files.length} files, inward dependencies, no cycles.`)
}
