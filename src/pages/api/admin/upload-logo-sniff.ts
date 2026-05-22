/** Sniff SVG from file content (first 256 bytes) to skip Sharp processing. */
export function looksLikeSvgFromBuffer(buffer: Buffer): boolean {
  const bufferStart = buffer.subarray(0, 256).toString('utf8').trimStart();
  return bufferStart.startsWith('<svg') || bufferStart.startsWith('<?xml');
}
