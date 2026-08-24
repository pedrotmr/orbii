import js from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import globals from "globals";
import tseslint from "typescript-eslint";
import {
  componentMustUseFunctionRules,
  noExplicitReturnTypeRules,
  nonComponentMustUseConstRules,
} from "./eslint/shared.mjs";

const nativeStructureRules = {
  rules: {
    "blank-line-between-consecutive-ifs": {
      meta: {
        fixable: "whitespace",
      },
      create(context) {
        const sourceCode = context.sourceCode;

        const checkBody = (body) => {
          for (let index = 1; index < body.length; index += 1) {
            const previous = body[index - 1];
            const current = body[index];

            if (
              previous.type !== "IfStatement" ||
              current.type !== "IfStatement"
            ) {
              continue;
            }

            const firstLeadingComment = sourceCode
              .getCommentsBefore(current)
              .find(
                (comment) =>
                  comment.range[0] > previous.range[1] &&
                  comment.loc.start.line > previous.loc.end.line,
              );
            const boundary = firstLeadingComment ?? current;
            const lineGap = boundary.loc.start.line - previous.loc.end.line;

            if (lineGap === 2) {
              continue;
            }

            context.report({
              node: current,
              message:
                "Leave exactly one blank line between consecutive if statements.",
              fix(fixer) {
                const indentation = " ".repeat(boundary.loc.start.column);

                return fixer.replaceTextRange(
                  [previous.range[1], boundary.range[0]],
                  `\n\n${indentation}`,
                );
              },
            });
          }
        };

        return {
          BlockStatement: (node) => checkBody(node.body),
          Program: (node) => checkBody(node.body),
          StaticBlock: (node) => checkBody(node.body),
          SwitchCase: (node) => checkBody(node.consequent),
        };
      },
    },
    "import-spacing": {
      meta: {
        fixable: "whitespace",
      },
      create(context) {
        const sourceCode = context.sourceCode;

        const replaceWhitespaceBetween = (from, to, text) => (fixer) =>
          fixer.replaceTextRange([from.range[1], to.range[0]], text);

        return {
          Program(node) {
            const body = node.body;
            const imports = body.filter(
              (statement) => statement.type === "ImportDeclaration",
            );

            for (let index = 1; index < imports.length; index += 1) {
              const previous = imports[index - 1];
              const current = imports[index];
              if (current.loc.start.line - previous.loc.end.line > 1) {
                context.report({
                  node: current,
                  message: "Do not leave blank lines between imports.",
                  fix: replaceWhitespaceBetween(previous, current, "\n"),
                });
              }
            }

            const lastImport = imports.at(-1);
            if (!lastImport) {
              return;
            }

            const nextStatement = body.find(
              (statement) =>
                statement.type !== "ImportDeclaration" &&
                statement.range[0] > lastImport.range[0],
            );
            if (!nextStatement) {
              return;
            }

            const textBetween = sourceCode.text.slice(
              lastImport.range[1],
              nextStatement.range[0],
            );
            if (textBetween !== "\n\n") {
              context.report({
                node: nextStatement,
                message: "Leave exactly one blank line after imports.",
                fix: replaceWhitespaceBetween(
                  lastImport,
                  nextStatement,
                  "\n\n",
                ),
              });
            }
          },
        };
      },
    },
    "styles-after-component": {
      meta: {},
      create(context) {
        const isStylesDeclaration = (node) => {
          if (node.type !== "VariableDeclaration") {
            return false;
          }
          return node.declarations.some((declaration) => {
            const init = declaration.init;
            return (
              declaration.id.type === "Identifier" &&
              declaration.id.name === "styles" &&
              init?.type === "CallExpression" &&
              init.callee.type === "MemberExpression" &&
              init.callee.object.type === "Identifier" &&
              init.callee.object.name === "StyleSheet" &&
              init.callee.property.type === "Identifier" &&
              init.callee.property.name === "create"
            );
          });
        };

        const isComponentDeclaration = (node) => {
          if (node.type === "FunctionDeclaration") {
            return Boolean(node.id?.name?.[0]?.match(/[A-Z]/));
          }

          if (node.type === "ExportDefaultDeclaration") {
            const declaration = node.declaration;
            return (
              declaration?.type === "FunctionDeclaration" &&
              Boolean(declaration.id?.name?.[0]?.match(/[A-Z]/))
            );
          }

          if (node.type === "ExportNamedDeclaration" && node.declaration) {
            return isComponentDeclaration(node.declaration);
          }

          if (node.type !== "VariableDeclaration") {
            return false;
          }
          return node.declarations.some(
            (declaration) =>
              declaration.id.type === "Identifier" &&
              Boolean(declaration.id.name[0]?.match(/[A-Z]/)),
          );
        };

        return {
          Program(node) {
            const firstComponent = node.body.find(isComponentDeclaration);
            if (!firstComponent) {
              return;
            }

            for (const statement of node.body) {
              if (!isStylesDeclaration(statement)) {
                continue;
              }

              if (statement.range[0] < firstComponent.range[0]) {
                context.report({
                  node: statement,
                  message:
                    "Define StyleSheet styles after the component in native files.",
                });
              }
            }
          },
        };
      },
    },
  },
};

const importSortRule = [
  "error",
  {
    type: "natural",
    order: "asc",
    ignoreCase: true,
    newlinesBetween: 0,
  },
];

export default tseslint.config(
  {
    ignores: [
      "**/.expo/**",
      "**/.agents/**",
      "**/.claude/**",
      "**/.cursor/**",
      "**/.github/**",
      "**/build/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/out/**",
      "**/_generated/**",
      "design-ideas/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{cjs,js,jsx,mjs,ts,tsx}"],
    plugins: {
      perfectionist,
      conventions: nativeStructureRules,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: "readonly",
      },
    },
    rules: {
      curly: ["error", "all"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-restricted-syntax": [
        "error",
        ...noExplicitReturnTypeRules,
        ...componentMustUseFunctionRules,
        ...nonComponentMustUseConstRules,
      ],
      "conventions/import-spacing": "error",
      "conventions/blank-line-between-consecutive-ifs": "error",
      "perfectionist/sort-imports": importSortRule,
    },
  },
  {
    files: ["apps/mobile/**/*.tsx"],
    plugins: {
      conventions: nativeStructureRules,
    },
    rules: {
      "conventions/styles-after-component": "error",
    },
  },
);
