// Shader sources are imported as strings (see the glsl plugin in vite.config.ts).
declare module '*.glsl' {
  const source: string;
  export default source;
}
declare module '*.vert' {
  const source: string;
  export default source;
}
declare module '*.frag' {
  const source: string;
  export default source;
}
