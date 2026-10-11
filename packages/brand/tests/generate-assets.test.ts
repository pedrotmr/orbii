import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const createFixture = () => {
  const root = mkdtempSync(join(tmpdir(), "brand-generator-test-"));
  const brand = join(root, "packages/brand");
  const mobile = join(root, "apps/mobile/assets");
  const tools = join(root, "tools");
  mkdirSync(brand, { recursive: true });
  mkdirSync(mobile, { recursive: true });
  mkdirSync(tools);
  for (const file of [
    "generate-assets.ts",
    "brand.config.json",
    "mobile-artwork.json",
  ]) {
    const source = join(sourceRoot, file);
    if (existsSync(source)) {
      cpSync(source, join(brand, file));
    }
  }
  for (const directory of ["svg", "animations"]) {
    cpSync(join(sourceRoot, directory), join(brand, directory), {
      recursive: true,
    });
  }
  const icon = join(brand, "icon/orbii.icon");
  mkdirSync(icon, { recursive: true });
  writeFileSync(join(icon, "icon.json"), JSON.stringify({ valid: true }));

  // Stub the external renderers; exercise the real CLI's filesystem behavior.
  const renderer = `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
const tool = path.basename(process.argv[1]);
if (tool === "xcode-select" || args.includes("--version") || args.includes("-version")) {
  console.log("fixture tool");
} else if (tool === "ictool") {
  const document = JSON.parse(fs.readFileSync(path.join(args[0], "icon.json"), "utf8"));
  if (!document.valid || (document.asset && !fs.existsSync(path.join(args[0], document.asset))) || document.failRendition === args[args.indexOf("--rendition") + 1]) {
    console.error("Invalid Icon Composer document");
    process.exit(1);
  }
  fs.writeFileSync(args[args.indexOf("--output-file") + 1], JSON.stringify(document));
} else if (tool === "rsvg-convert") {
  fs.copyFileSync(args.at(-1), args[args.indexOf("--output") + 1]);
} else {
  fs.copyFileSync(args[0], args.at(-1));
}
`;
  for (const tool of ["ictool", "magick", "rsvg-convert", "xcode-select"]) {
    writeFileSync(join(tools, tool), renderer, { mode: 0o755 });
  }

  const generate = (source?: string) =>
    spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        join(brand, "generate-assets.ts"),
        ...(source ? [source] : []),
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          ICTOOL_PATH: join(tools, "ictool"),
          PATH: `${tools}:${process.env.PATH}`,
        },
      },
    );
  const cleanup = () => rmSync(root, { recursive: true, force: true });
  return { root, brand, mobile, icon, generate, cleanup };
};
const snapshot = (directory: string) => {
  const files: Record<string, string> = {};
  const visit = (relative = "") => {
    for (const entry of readdirSync(join(directory, relative), {
      withFileTypes: true,
    })) {
      const name = join(relative, entry.name);
      if (entry.isDirectory()) {
        visit(name);
      } else {
        files[name] = createHash("sha256")
          .update(readFileSync(join(directory, name)))
          .digest("hex");
      }
    }
  };
  visit();
  return files;
};

for (const invalid of [
  "not json",
  JSON.stringify({ valid: true, asset: "missing.svg" }),
  JSON.stringify({ valid: true, failRendition: "Dark" }),
]) {
  test(`failed import preserves existing source and output: ${invalid}`, (t) => {
    const fixture = createFixture();
    t.after(fixture.cleanup);
    const initial = fixture.generate();
    assert.equal(initial.status, 0, initial.stderr);
    const before = snapshot(fixture.brand);
    const mobileBefore = snapshot(fixture.mobile);
    const imported = join(fixture.root, "new.icon");
    mkdirSync(imported);
    writeFileSync(join(imported, "icon.json"), invalid);

    const result = fixture.generate(imported);

    assert.notEqual(result.status, 0);
    assert.deepEqual(snapshot(fixture.brand), before);
    assert.deepEqual(snapshot(fixture.mobile), mobileBefore);
  });
}

test("valid import replaces canonical document and synchronizes mobile", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const imported = join(fixture.root, "new.icon");
  mkdirSync(imported);
  writeFileSync(
    join(imported, "icon.json"),
    JSON.stringify({ valid: true, artwork: "new" }),
  );

  const result = fixture.generate(imported);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(snapshot(fixture.icon), snapshot(imported));
  assert.deepEqual(
    snapshot(join(fixture.mobile, "orbii.icon")),
    snapshot(imported),
  );
});

test("the seeded ownership manifest prunes artwork on the first run", (t) => {
  const fixture = createFixture();
  t.after(fixture.cleanup);
  const animations = join(fixture.mobile, "brand/animations");
  mkdirSync(animations, { recursive: true });
  const removed = join(animations, "return-loop-splash-light.json");
  const mobileOwned = join(animations, "mobile-owned.json");
  writeFileSync(removed, "old generated artwork");
  writeFileSync(mobileOwned, "mobile artwork");
  rmSync(join(fixture.brand, "animations"), { recursive: true });

  const result = fixture.generate();

  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(removed), false);
  assert.equal(readFileSync(mobileOwned, "utf8"), "mobile artwork");
});

for (const removeDirectory of [false, true]) {
  test(`synchronization prunes deleted owned artwork and preserves mobile files (absent animations: ${removeDirectory})`, (t) => {
    const fixture = createFixture();
    t.after(fixture.cleanup);
    const svg = join(fixture.brand, "svg/retired.svg");
    const animation = join(fixture.brand, "animations/retired.json");
    writeFileSync(svg, "retired SVG");
    writeFileSync(animation, "retired animation");
    const initial = fixture.generate();
    assert.equal(initial.status, 0, initial.stderr);
    const mobileOwned = join(fixture.mobile, "brand/mobile-owned.svg");
    const mobileAnimation = join(
      fixture.mobile,
      "brand/animations/mobile-owned.json",
    );
    writeFileSync(mobileOwned, "mobile SVG");
    writeFileSync(mobileAnimation, "mobile animation");
    rmSync(svg);
    rmSync(removeDirectory ? join(fixture.brand, "animations") : animation, {
      recursive: removeDirectory,
    });

    const result = fixture.generate();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(fixture.mobile, "brand/retired.svg")), false);
    assert.equal(
      existsSync(join(fixture.mobile, "brand/animations/retired.json")),
      false,
    );
    assert.equal(readFileSync(mobileOwned, "utf8"), "mobile SVG");
    assert.equal(readFileSync(mobileAnimation, "utf8"), "mobile animation");
    if (removeDirectory) {
      assert.equal(
        existsSync(
          join(
            fixture.mobile,
            "brand/animations/return-loop-splash-light.json",
          ),
        ),
        false,
      );
    }
  });
}
