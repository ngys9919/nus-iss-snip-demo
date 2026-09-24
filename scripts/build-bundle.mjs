import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundleDir = join(root, "bundle");
const frontendDir = join(root, "frontend");
const outputDir = join(frontendDir, "dist", "snip-frontend", "browser");
const shouldPush = process.argv.includes("--push");

function needsShell(command) {
  return process.platform === "win32" && (command === "npm" || command === "npx");
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: needsShell(command),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
  }
}

function output(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: needsShell(command),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
  }
  return result.stdout.trim();
}

function stagedChanges(cwd) {
  return spawnSync("git", ["diff", "--cached", "--quiet"], {
    cwd,
    stdio: "ignore",
    shell: false,
  }).status !== 0;
}

function writeText(path, content) {
  writeFileSync(path, content, "utf8");
}

function assembleBundle() {
  rmSync(join(bundleDir, "public"), { recursive: true, force: true });
  mkdirSync(join(bundleDir, "public"), { recursive: true });
  cpSync(outputDir, join(bundleDir, "public"), { recursive: true });
  cpSync(join(root, "backend", "server.js"), join(bundleDir, "server.js"));
  cpSync(join(root, "cli", "cli.js"), join(bundleDir, "cli.js"));

  writeText(join(bundleDir, ".env"), "PUBLIC_DIR=./public\n");
  writeText(
    join(bundleDir, "package.json"),
    `${JSON.stringify({
      name: "snip-bundle",
      private: true,
      scripts: { start: "bun server.js" },
    }, null, 2)}\n`,
  );
  writeText(
    join(bundleDir, "Dockerfile"),
    "FROM oven/bun:1-alpine\nCOPY . .\nENV PORT=3000\nEXPOSE 3000\nCMD bun server.js\n",
  );
  writeText(
    join(bundleDir, ".dockerignore"),
    ".git\n.gitmodules\nnode_modules\n*.log\n",
  );
  writeText(
    join(bundleDir, "railway.json"),
    `${JSON.stringify({
      "$schema": "https://railway.app/railway.schema.json",
      build: { builder: "DOCKERFILE" },
    }, null, 2)}\n`,
  );
}

function commitBundle() {
  run("git", ["add", "-A"], bundleDir);
  if (!stagedChanges(bundleDir)) {
    console.log("bundle: unchanged");
    return false;
  }
  run("git", ["commit", "-m", "Generate bundle release"], bundleDir);
  console.log("bundle: committed");
  return true;
}

function commitMain() {
  run("git", ["add", "bundle"], root);
  if (!stagedChanges(root)) {
    console.log("main: unchanged");
    return false;
  }
  run("git", ["commit", "-m", "Bump bundle submodule"], root);
  console.log("main: committed");
  return true;
}

console.log("Updating source submodules...");
run("git", ["submodule", "update", "--init", "--remote", "backend", "frontend", "cli"]);

console.log("Building frontend...");
run("npm", ["install"], frontendDir);
run("npx", ["ng", "build"], frontendDir);
if (!existsSync(join(outputDir, "index.html"))) {
  throw new Error(`Angular build output is missing: ${join(outputDir, "index.html")}`);
}

console.log("Assembling bundle...");
assembleBundle();
const bundleChanged = commitBundle();
const mainChanged = commitMain();

if (shouldPush) {
  run("git", ["push", "origin", "HEAD:bundle"], bundleDir);
  run("git", ["push", "origin", "main"], root);
  console.log("Pushed bundle and main.");
} else {
  console.log("Dry run: local commits created; nothing pushed.");
}

if (!bundleChanged && !mainChanged && !shouldPush) {
  console.log("Nothing to commit.");
}
