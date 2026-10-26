/**
 * MapLibre needs WebGL 2. Creating a real context also catches browsers that
 * have the API but refuse it (blocked GPU, hardware acceleration off); the
 * test context is released right away.
 */
export function canRenderWebGL2(): boolean {
  const gl = document.createElement("canvas").getContext("webgl2");
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return gl !== null;
}
