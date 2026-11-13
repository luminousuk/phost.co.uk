import { defineConfig, type Plugin } from 'vite';

/**
 * Shrinks GLSL for production: strips comments, collapses whitespace and removes spaces around
 * punctuation. Uniform and attribute names are left alone because the script looks them up by name.
 */
function minifyGlsl(source: string): string {
  return (
    source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      // preprocessor directives must stay on their own line
      .map((line) => (line.startsWith('#') ? `\n${line}\n` : line))
      .join(' ')
      .replace(/ *([{}()[\];,=+\-*/<>!&|?:]) */g, '$1')
      .replace(/\n /g, '\n')
      .trim() + '\n'
  );
}

/** Imports .glsl/.vert/.frag files as strings, minified in production builds. */
function glsl(minify: boolean): Plugin {
  return {
    name: 'phost-glsl',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(glsl|vert|frag)$/.test(id)) return null;
      const source = minify ? minifyGlsl(code) : code;
      return { code: `export default ${JSON.stringify(source)};`, map: null };
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [glsl(command === 'build')],
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2 },
      mangle: { toplevel: true },
      format: { comments: false },
    },
    modulePreload: { polyfill: false },
    assetsInlineLimit: 0,
  },
  server: { port: 8124 },
  preview: { port: 8124 },
}));
