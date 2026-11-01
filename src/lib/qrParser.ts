/**
 * QR Code Parser for formatted text strings
 * Supports formats like "Project: PRJ001", "Item code: ITEM123"
 */

export type QRType = 'project' | 'item' | 'unknown';

export interface ParsedQR {
  type: QRType;
  value: string;
  raw: string;
}

// Default label mappings for each step type
const DEFAULT_LABEL_PATTERNS: Record<QRType, RegExp[]> = {
  project: [
    /^Project\s*:\s*(.+)$/i,
    /^Projet\s*:\s*(.+)$/i,
  ],
  item: [
    /^Item\s*code\s*:\s*(.+)$/i,
    /^Item\s*:\s*(.+)$/i,
    /^Code\s*:\s*(.+)$/i,
  ],
  unknown: [],
};

// Mutable label patterns (can be customized with projectLabel)
let LABEL_PATTERNS: Record<QRType, RegExp[]> = { ...DEFAULT_LABEL_PATTERNS };

/**
 * Update the project label patterns to support custom organization names
 * e.g., "Job", "Work Order", "Asset", etc.
 */
export function setProjectLabelPatterns(customLabel: string): void {
  const escapedLabel = customLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  LABEL_PATTERNS = {
    ...DEFAULT_LABEL_PATTERNS,
    project: [
      new RegExp(`^${escapedLabel}\\s*:\\s*(.+)$`, 'i'),
      ...DEFAULT_LABEL_PATTERNS.project,
    ],
  };
}

/**
 * Reset label patterns to defaults
 */
export function resetLabelPatterns(): void {
  LABEL_PATTERNS = { ...DEFAULT_LABEL_PATTERNS };
}

/**
 * Normalize a scanned value: trim whitespace and convert to uppercase
 */
export function normalizeValue(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Parse a QR code string to extract the type and value
 * All values are normalized to uppercase for consistent database matching
 */
export function parseQRCode(raw: string): ParsedQR {
  const trimmed = raw.trim();

  // Try to match against known patterns
  for (const [type, patterns] of Object.entries(LABEL_PATTERNS) as [QRType, RegExp[]][]) {
    if (type === 'unknown') continue;

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        return {
          type,
          value: normalizeValue(match[1]),
          raw: trimmed,
        };
      }
    }
  }

  // If no pattern matches, return as unknown with the raw value
  // This allows backward compatibility with plain barcodes
  // Still normalize the value to uppercase
  return {
    type: 'unknown',
    value: normalizeValue(trimmed),
    raw: trimmed,
  };
}

/**
 * Validate that a parsed QR matches the expected step
 * Only 'items' step is used in the new single-step flow.
 */
export function validateQRForStep(
  parsed: ParsedQR,
  expectedStep: 'items'
): { valid: boolean; error?: string } {
  const stepToType: Record<string, QRType> = {
    items: 'item',
  };

  const expectedType = stepToType[expectedStep];

  // If QR has a recognized type, it must match the expected step
  if (parsed.type !== 'unknown') {
    if (parsed.type === expectedType) {
      return { valid: true };
    }

    // Wrong type for current step
    return { valid: false, error: "Invalid QR format. Please ensure the QR contains 'Item code'." };
  }

  // Unknown type (plain barcode) — allow for backward compatibility
  return { valid: true };
}

/**
 * Resolve the native AudioContext constructor, with Safari's vendor-prefixed
 * webkitAudioContext as a fallback. Returns undefined when unsupported.
 */
function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window.AudioContext === "function") return window.AudioContext;
  const safariWindow: Window & { webkitAudioContext?: typeof AudioContext } = window;
  if (typeof safariWindow.webkitAudioContext === "function") {
    return safariWindow.webkitAudioContext;
  }
  return undefined;
}

/**
 * Play a beep sound for successful scan feedback
 */
export function playSuccessBeep(): void {
  try {
    const Ctx = getAudioContextCtor();
    if (!Ctx) throw new Error("AudioContext not supported");
    const audioContext = new Ctx();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1200; // Higher frequency for success
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  } catch (e) {
    // Audio not supported or blocked
    console.warn('Could not play beep sound:', e);
  }
}

/**
 * Play an error beep sound
 */
export function playErrorBeep(): void {
  try {
    const Ctx = getAudioContextCtor();
    if (!Ctx) throw new Error("AudioContext not supported");
    const audioContext = new Ctx();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 300; // Lower frequency for error
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.warn('Could not play beep sound:', e);
  }
}
