export const noExplicitReturnTypeRules = [
  {
    selector: "FunctionDeclaration[returnType]",
    message: "Do not add explicit return types to functions.",
  },
  {
    selector: "FunctionExpression[returnType]",
    message: "Do not add explicit return types to functions.",
  },
  {
    selector: "ArrowFunctionExpression[returnType]",
    message: "Do not add explicit return types to functions.",
  },
];

/** React components (PascalCase) must use the `function` keyword. */
export const componentMustUseFunctionRules = [
  {
    selector:
      "VariableDeclarator[id.name=/^[A-Z]/][init.type=ArrowFunctionExpression]",
    message:
      "React components must use `function ComponentName()` or `export default function ComponentName()`, not `const ComponentName = () =>`.",
  },
  {
    selector:
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name=/^[A-Z]/][init.type=ArrowFunctionExpression]",
    message:
      "React components must use `export function ComponentName()` or `export default function ComponentName()`, not `export const ComponentName = () =>`.",
  },
  {
    selector: "ExportDefaultDeclaration > ArrowFunctionExpression",
    message:
      "Use `export default function ComponentName()` for default-exported components, not a default arrow function.",
  },
];

/** Hooks, helpers, and handlers use `const` + arrow functions (not `function`). */
export const nonComponentMustUseConstRules = [
  {
    selector: "FunctionDeclaration[id.name=/^[a-z]/]",
    message:
      "Non-component functions must use `const name = () =>`. Reserve `function` for React components (PascalCase names).",
  },
];
