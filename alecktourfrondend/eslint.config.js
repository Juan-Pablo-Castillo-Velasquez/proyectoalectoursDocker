// Configuración de ESLint (flat config, formato nativo desde ESLint 9+).
//
// Este proyecto no tenía ningún linter configurado — se eligió ESLint +
// typescript-eslint por ser el estándar de facto para React + TypeScript
// con Vite. No se usan las reglas "type-checked" de typescript-eslint
// (las que requieren tsconfig.json + el compilador de TS analizando tipos
// reales) porque el proyecto no tiene tsconfig.json: es un proyecto
// generado por Figma Make que usa Vite/esbuild solo para transpilar
// (quita los tipos, no los verifica) — confirmado que no hay ningún
// tsconfig.json ni build con verificación de tipos hoy. Añadir eso sería
// un cambio de infraestructura mucho más grande (herencia de tipos en
// cientos de archivos existentes) y queda fuera del alcance de "agregar
// un linter". Las reglas de abajo son las que sí funcionan a nivel de
// sintaxis/patrones sin necesitar información de tipos.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "build", "src/app/components/ui/**"],
    // src/app/components/ui/** son los componentes base de shadcn/ui
    // (generados, no se editan a mano en el día a día) — lintearlos no
    // aporta nada y su volumen ahogaría los hallazgos del código propio.
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      // Reglas de react-hooks: la de "rules-of-hooks" detecta violaciones
      // reales (hooks llamados condicionalmente, fuera de un componente)
      // que rompen la app en runtime — se deja como error. La de
      // "exhaustive-deps" (dependencias faltantes en useEffect/useMemo)
      // es más una guía que puede tener falsos positivos legítimos
      // (ej. un setter de useState que es estable a propósito) — queda
      // como warning para revisar caso por caso, no bloquear el lint.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Solo relevante si se usa Vite Fast Refresh; advierte si un
      // archivo de componente exporta también valores no-componente.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Accesibilidad — advertencias, no errores: útiles para ir
      // corrigiendo, pero no deberían bloquear el pipeline de un día
      // para otro en un proyecto que nunca las tuvo. Algunas reglas de
      // jsx-a11y vienen configuradas como ["error", {opciones}] en vez de
      // un string plano — hay que bajar solo el primer elemento y
      // conservar las opciones, si no la regla se queda en "error".
      ...Object.fromEntries(
        Object.entries(jsxA11y.configs.recommended.rules).map(([rule, severity]) => {
          if (Array.isArray(severity)) {
            const [level, ...rest] = severity;
            return [rule, level === "error" ? ["warn", ...rest] : severity];
          }
          return [rule, severity === "error" ? "warn" : severity];
        })
      ),

      // El código existente usa `any` en varios puntos (ver
      // CONTRIBUTING.md, que ya pide "evitar any" como convención) —
      // queda en warning para reforzar esa convención sin romper el
      // build por deuda ya existente.
      "@typescript-eslint/no-explicit-any": "warn",
      // El patrón "condicion ? fnA() : fnB();" como sentencia suelta ya
      // se usa de forma intencional en varios lugares del proyecto (ej.
      // Admindashboard.tsx, Testimonios.tsx) para elegir entre dos
      // llamadas según una condición — es una expresión usada por su
      // efecto secundario, no un bug, así que se permite explícitamente
      // en vez de forzar reescribirlo como if/else.
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Los componentes de este proyecto no siempre declaran el tipo de
      // retorno explícito (estilo ya establecido) — no se fuerza.
      "@typescript-eslint/no-empty-object-type": "off",
    },
  }
);
