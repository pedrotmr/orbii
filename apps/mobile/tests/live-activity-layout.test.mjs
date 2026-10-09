import { transformSync } from "@babel/core";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(
  new URL(
    "../src/live-activity/orbit-live-activity-widget.ios.tsx",
    import.meta.url,
  ),
  "utf8",
);
const compiled = transformSync(source, {
  filename: "orbit-live-activity-widget.ios.tsx",
  presets: [["babel-preset-expo", { platform: "ios" }]],
  ast: true,
  babelrc: false,
  configFile: false,
});
const declaration = compiled.ast.program.body
  .filter((node) => node.type === "VariableDeclaration")
  .flatMap((node) => node.declarations)
  .find((node) => node.id.name === "OrbitLiveActivityWidget");
const layout = declaration.init.quasis[0].value.cooked;

// Expo's extension supplies UI globals, but no application imports or closures.
const uiNames = [
  "Circle",
  "HStack",
  "Image",
  "ProgressView",
  "Spacer",
  "Text",
  "VStack",
  "ZStack",
  "accessibilityElement",
  "accessibilityHidden",
  "accessibilityLabel",
  "font",
  "foregroundStyle",
  "frame",
  "lineLimit",
  "minimumScaleFactor",
  "offset",
  "padding",
  "progressViewStyle",
  "rotationEffect",
  "strokeBorder",
  "tint",
  "truncationMode",
];
const globals = Object.fromEntries(uiNames.map((name) => [name, name]));
const modifiers = uiNames.filter((name) => name[0] === name[0].toLowerCase());
for (const name of modifiers) {
  globals[name] = (...args) => ({ modifier: name, args });
}
const jsx = (type, props, key) => ({ type, props, key });
Object.assign(globals, { _jsx: jsx, _jsxs: jsx });

const content = {
  phase: "active",
  completedCount: 1,
  totalCount: 2,
  accentColor: "orange",
  logoColor: "teal",
  reducedLuminanceColor: "white",
  logoDotColor: "coral",
  habits: [
    { id: "walk", name: "A short walk", isComplete: true },
    { id: "read", name: "Read a few pages", isComplete: false },
  ],
  spacing: {
    horizontalInset: 20,
    verticalInset: 16,
    sectionGap: 12,
    rowGap: 8,
    iconGap: 8,
    listLeadingInset: 4,
    compactGap: 8,
    microGap: 4,
    progressRingSize: 24,
    logoSize: 16,
  },
};

for (const phase of ["active", "complete"]) {
  test(`serialized ${phase} Live Activity renders without app imports`, () => {
    const result = runInNewContext(`(${layout})(content, environment)`, {
      ...globals,
      content: { ...content, phase },
      environment: { isLuminanceReduced: false },
    });
    assert.deepEqual(
      Object.keys(result).sort(),
      [
        "banner",
        "bannerSmall",
        "compactLeading",
        "compactTrailing",
        "expandedBottom",
        "expandedCenter",
        "expandedLeading",
        "expandedTrailing",
        "minimal",
      ].sort(),
    );
    const banner = JSON.stringify(result.banner);
    assert.ok(banner.includes("Today’s Orbit"));
    assert.ok(banner.includes("A short walk, completed"));
    assert.ok(banner.includes("Read a few pages, not completed"));
    assert.ok(banner.includes(phase === "complete" ? "Complete" : "1 of 2"));
  });
}

for (const isLuminanceReduced of [false, true]) {
  test(`native mark uses token payload with reduced luminance ${isLuminanceReduced}`, () => {
    const result = runInNewContext(`(${layout})(content, environment)`, {
      ...globals,
      content,
      environment: { isLuminanceReduced },
    });
    const mark = JSON.stringify(result.compactLeading);
    assert.ok(mark.includes(isLuminanceReduced ? "white" : "teal"));
    assert.equal(mark.includes("coral"), !isLuminanceReduced);
    assert.equal(mark.includes("orange"), false);
    assert.ok(mark.includes("strokeBorder"));
    assert.ok(mark.includes("offset"));
  });
}
