import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface BrandConfig {
  name: string;
  lightMark: string;
  darkMark: string;
  iconBackground: string;
  designGeneration: number;
}

const brandRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(brandRoot, "../..");
const config: BrandConfig = JSON.parse(
  readFileSync(join(brandRoot, "brand.config.json"), "utf8"),
);
const run = (command: string, args: string[]) => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} failed: ${result.error?.message ?? result.stderr ?? result.stdout}`,
    );
  }

  return result.stdout.trim();
};

const developerDirectory = run("xcode-select", ["-p"]);
const ictool =
  process.env.ICTOOL_PATH ??
  resolve(
    developerDirectory,
    "../Applications/Icon Composer.app/Contents/Executables/ictool",
  );
if (!existsSync(ictool)) {
  throw new Error(
    "Icon Composer's ictool was not found. Select a full Xcode installation or set ICTOOL_PATH.",
  );
}

// Check every tool before changing any committed output.
run(ictool, ["--version"]);
run("magick", ["-version"]);
run("rsvg-convert", ["--version"]);

const icon = join(brandRoot, "icon", `${config.name}.icon`);
const importedSource = process.argv[2];
const source = importedSource ? resolve(importedSource) : icon;
if (!existsSync(join(source, "icon.json"))) {
  throw new Error(
    `Missing ${source}/icon.json. Pass an Icon Composer .icon directory to import it.`,
  );
}

const scratch = mkdtempSync(join(tmpdir(), `${config.name}-brand-`));
const importedIcon = join(scratch, basename(icon));
const importing = source !== icon;
const renderedIcon = importing ? importedIcon : icon;
const raster = (name: string) => join(scratch, name);
// Remove file timestamps so regeneration leaves identical PNGs unchanged.
const magick = (...args: string[]) =>
  run("magick", [...args.slice(0, -1), "-strip", args[args.length - 1]]);
const renderIcon = (rendition: string, destination: string) => {
  run(ictool, [
    renderedIcon,
    "--export-image",
    "--output-file",
    destination,
    "--platform",
    "iOS",
    "--rendition",
    rendition,
    "--width",
    "1024",
    "--height",
    "1024",
    "--scale",
    "1",
    "--design-generation",
    String(config.designGeneration),
  ]);
};
const renderMark = (source: string, destination: string) => {
  // librsvg preserves SVG dashes and round caps; ImageMagick's MSVG renderer does not.
  run("rsvg-convert", [
    "--width",
    "600",
    "--height",
    "600",
    "--output",
    destination,
    join(brandRoot, source),
  ]);
};

const replaceIcon = () => {
  mkdirSync(dirname(icon), { recursive: true });
  const staging = mkdtempSync(join(dirname(icon), `.${config.name}-import-`));
  const next = join(staging, basename(icon));
  const previous = join(staging, "previous.icon");
  let preserveBackup = false;
  try {
    cpSync(importedIcon, next, { recursive: true });
    if (existsSync(icon)) {
      renameSync(icon, previous);
    }

    try {
      renameSync(next, icon);
    } catch (error) {
      if (existsSync(previous)) {
        try {
          renameSync(previous, icon);
        } catch (rollbackError) {
          preserveBackup = true;
          throw new Error(
            `Could not restore ${icon}. The previous document is preserved at ${previous}.`,
            { cause: rollbackError },
          );
        }
      }
      throw error;
    }
  } finally {
    if (!preserveBackup) {
      rmSync(staging, { recursive: true, force: true });
    }
  }
};
const collectFiles = (directory: string, prefix = "") => {
  const files: string[] = [];
  if (!existsSync(directory)) {
    return files;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const name = join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(join(directory, entry.name), name));
    } else if (entry.isFile()) {
      files.push(name);
    }
  }
  return files;
};
const synchronizeArtwork = (destination: string) => {
  const manifest = join(brandRoot, "mobile-artwork.json");
  const previous: string[] = JSON.parse(readFileSync(manifest, "utf8"));
  const current = new Map<string, string>();
  for (const [directory, prefix] of [
    ["svg", ""],
    ["animations", "animations"],
  ]) {
    const sourceDirectory = join(brandRoot, directory);
    for (const file of collectFiles(sourceDirectory)) {
      // Each consumer owns its animation guide; only artwork is synchronized.
      if (prefix === "animations" && file === "README.md") {
        continue;
      }

      current.set(join(prefix, file), join(sourceDirectory, file));
    }
  }
  // Only names recorded by an earlier generation may be removed.
  for (const file of previous) {
    const target = resolve(destination, file);
    if (!target.startsWith(`${resolve(destination)}/`)) {
      throw new Error(`Invalid mobile artwork path: ${file}`);
    }

    if (!current.has(file)) {
      rmSync(target, { force: true });
    }
  }
  for (const [file, sourceFile] of current) {
    const target = join(destination, file);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(sourceFile, target);
  }
  writeFileSync(
    manifest,
    `${JSON.stringify([...current.keys()].sort(), null, 2)}\n`,
  );
};

try {
  if (importing) {
    cpSync(source, importedIcon, { recursive: true });
  }

  renderIcon("Default", raster("composed-light.png"));
  renderIcon("Dark", raster("composed-dark.png"));
  magick(
    raster("composed-light.png"),
    "-background",
    config.iconBackground,
    "-alpha",
    "remove",
    "-alpha",
    "off",
    "-depth",
    "8",
    raster("icon-1024.png"),
  );
  magick(
    raster("composed-dark.png"),
    "-depth",
    "8",
    raster("icon-dark-1024.png"),
  );
  magick(
    raster("composed-light.png"),
    "-resize",
    "640x640",
    "-background",
    "none",
    "-gravity",
    "center",
    "-extent",
    "1024x1024",
    "-depth",
    "8",
    raster("adaptive-icon.png"),
  );
  renderMark(config.lightMark, raster("splash-logo.png"));
  renderMark(config.darkMark, raster("splash-logo-dark.png"));
  magick(
    raster("splash-logo.png"),
    "-fill",
    "black",
    "-colorize",
    "100",
    "-resize",
    "640x640",
    "-background",
    "none",
    "-gravity",
    "center",
    "-extent",
    "1024x1024",
    raster("monochrome-icon.png"),
  );
  magick(
    raster("icon-1024.png"),
    "-resize",
    "180x180",
    raster("apple-touch-icon.png"),
  );
  magick(raster("icon-1024.png"), "-resize", "32x32", raster("favicon-32.png"));

  const files = [
    "icon-1024.png",
    "icon-dark-1024.png",
    "adaptive-icon.png",
    "monochrome-icon.png",
    "splash-logo.png",
    "splash-logo-dark.png",
    "apple-touch-icon.png",
    "favicon-32.png",
  ];
  // A failed import or render leaves committed source and output untouched.
  if (importing) {
    replaceIcon();
  }

  mkdirSync(join(brandRoot, "png"), { recursive: true });
  for (const file of files) {
    cpSync(raster(file), join(brandRoot, "png", file));
  }

  const mobileAssets = join(repositoryRoot, "apps/mobile/assets");
  const mobileIcon = join(mobileAssets, basename(icon));
  rmSync(mobileIcon, { recursive: true, force: true });
  cpSync(icon, mobileIcon, { recursive: true });
  const mobileCopies: Record<string, string> = {
    "icon-1024.png": "icon.png",
    "adaptive-icon.png": "adaptive-icon.png",
    "monochrome-icon.png": "android-icon-monochrome.png",
    "splash-logo.png": "splash-icon.png",
    "splash-logo-dark.png": "splash-icon-dark.png",
    "favicon-32.png": "favicon.png",
  };
  for (const [source, target] of Object.entries(mobileCopies)) {
    cpSync(raster(source), join(mobileAssets, target));
  }

  synchronizeArtwork(join(mobileAssets, "brand"));
  console.log(
    `Generated ${files.length} brand PNGs and synchronized ${config.name}.icon and mobile assets.`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
