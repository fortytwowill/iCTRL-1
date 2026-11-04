import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, Keyboard } from "lucide-react";
import { Button, TextInput, Text, Stack, Group } from "@mantine/core";
import { useItems } from "@/hooks/useInventory";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  isActive: boolean;
  onCameraActivated?: () => void;
  placeholder?: string;
  className?: string;
}

function makeScannerId() {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `scanner-${uuid}`;
  return `scanner-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/**
 * IMPORTANT: `html5-qrcode` mutates the DOM inside the target element (it can clear/replace children).
 * To avoid React DOM reconciliation errors, React must NOT render any children inside that target element.
 */
function ScannerContainer({
  onScan,
  onError,
  onStarted,
}: {
  onScan: (code: string) => void;
  onError: (error: string) => void;
  onStarted?: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const targetIdRef = useRef(makeScannerId());
  const [isScanning, setIsScanning] = useState(false);

  // Use refs for callbacks so the effect doesn't re-run when they change
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const onStartedRef = useRef(onStarted);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onStartedRef.current = onStarted; }, [onStarted]);

  useEffect(() => {
    let alive = true;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(targetIdRef.current, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: false,
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (!alive) return;
            globalThis.setTimeout(() => {
              onScanRef.current(decodedText);
            }, 1000);
          },
          () => {},
        );

        if (alive) {
          setIsScanning(true);
          onStartedRef.current?.();
        }
      } catch (error) {
        console.error("Scanner error:", error);
        if (alive) onErrorRef.current("Camera access denied or unavailable");
      }
    };

    const t = window.setTimeout(() => {
      start();
    }, 0);

    return () => {
      alive = false;
      window.clearTimeout(t);

      const scanner = scannerRef.current;
      scannerRef.current = null;
      setIsScanning(false);

      if (!scanner) return;

      void (async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const anyScanner = scanner as any;
          if (anyScanner?.isScanning) {
            await scanner.stop();
          }
        } catch {
          // ignore
        }

        try {
          scanner.clear();
        } catch {
          // ignore
        }
      })();
    };
    // Stable effect — callbacks accessed via refs so scanner is not torn down on re-renders
     
  }, []);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--mantine-radius-xl)",
        border: `2px dashed ${isScanning ? "var(--mantine-color-blue-filled)" : "var(--mantine-color-default-border)"}`,
        minHeight: 280,
      }}
      className={isScanning ? "scanner-pulse" : undefined}
    >
      {/* The ONLY element html5-qrcode is allowed to mutate */}
      <div id={targetIdRef.current} style={{ position: "absolute", inset: 0 }} />

      {!isScanning && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--mantine-color-gray-light-hover)" }}>
          <div style={{ textAlign: "center" }}>
            <Camera size={48} style={{ margin: "0 auto 8px", color: "var(--mantine-color-dimmed)" }} className="animate-pulse" />
            <Text size="sm" c="dimmed">Starting camera...</Text>
          </div>
        </div>
      )}

      {isScanning && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 4, background: "linear-gradient(to right, transparent, var(--mantine-color-blue-filled), transparent)" }} className="scan-line" />
      )}
    </div>
  );
}

export function BarcodeScanner({
  onScan,
  isActive,
  onCameraActivated,
  placeholder = "Scan or enter code...",
  className,
}: BarcodeScannerProps) {
  const [useCamera, setUseCamera] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // We check for isMobile to restrict the dropdown results count (desktop: 5, mobile: 3)
  const isMobile = useMediaQuery("(max-width: 640px)");
  const { data: items } = useItems();

  const filteredItems = useMemo(() => {
    if (!manualCode.trim() || !items) return [];

    const searchTerms = manualCode.toLowerCase().trim().split(/\s+/);
    
    return items
      .filter((item) => {
        const itemCodeMatch = item.item_code.toLowerCase();
        const vendorCodeMatch = (item.vendor_code || "").toLowerCase();
        const descriptionMatch = (item.description || "").toLowerCase();
        
        // Return true if ALL search terms find a match in at least one field
        return searchTerms.every(term => 
          itemCodeMatch.includes(term) || 
          vendorCodeMatch.includes(term) || 
          descriptionMatch.includes(term)
        );
      })
      .slice(0, isMobile ? 3 : 5); // Slice down the list size to not drown the UI
  }, [items, manualCode, isMobile]);

  const handleScannerError = useCallback((error: string) => {
    setScannerError(error);
    // Keep useCamera=true so the error panel renders (it requires useCamera to be true).
    // The user can explicitly switch to manual via the "Use Manual Entry" button inside the error panel.
  }, []);

  const activateCamera = () => {
    setScannerError(null);
    setUseCamera(true);
    setScannerKey((k) => k + 1);
  };

  const activateManual = () => {
    setScannerError(null);
    setUseCamera(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <Stack gap="md" className={className}>
      {/* Mode Toggle */}
      <Group gap="xs">
        <Button variant={useCamera ? "filled" : "default"} size="compact-sm" onClick={activateCamera} style={{ flex: 1 }}>
          <Camera size={16} style={{ marginRight: 8 }} />
          Camera
        </Button>
        <Button variant={!useCamera ? "filled" : "default"} size="compact-sm" onClick={activateManual} style={{ flex: 1 }}>
          <Keyboard size={16} style={{ marginRight: 8 }} />
          Manual
        </Button>
      </Group>

      {/* Scanner View */}
      {useCamera && isActive && !scannerError ? (
        <ScannerContainer
          key={scannerKey}
          onScan={onScan}
          onError={handleScannerError}
          onStarted={onCameraActivated}
        />
      ) : null}

      {/* Scanner Error */}
      {scannerError && useCamera && (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "var(--mantine-radius-xl)",
            border: "2px dashed var(--mantine-color-default-border)",
            minHeight: 280,
          }}
        >
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--mantine-color-gray-light-hover)" }}>
            <div style={{ textAlign: "center", padding: 16 }}>
              <CameraOff size={48} style={{ margin: "0 auto 8px", color: "var(--mantine-color-red-filled)" }} />
              <Text size="sm" c="red">{scannerError}</Text>
              <Button variant="default" size="compact-sm" onClick={activateManual} mt="md">
                Use Manual Entry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry */}
      {(!useCamera || !isActive) && (
        <form onSubmit={handleManualSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }} className="sm:flex-row">
          <div style={{ position: "relative", flex: 1 }}>
            <TextInput
              value={manualCode}
              onChange={(e) => setManualCode(e.currentTarget.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Delay hiding dropdown so clicks can register on the <li> elements
                setTimeout(() => setIsFocused(false), 150);
              }}
              placeholder={placeholder}
              autoFocus
            />
            {/* Auto-complete Dropdown */}
            {isFocused && filteredItems.length > 0 && (
              <ul style={{ position: "absolute", left: 0, marginTop: 4, width: "100%", maxHeight: 300, overflow: "auto", borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-default-border)", backgroundColor: "var(--mantine-color-body)", boxShadow: "var(--mantine-shadow-md)", zIndex: 50 }}>
                {filteredItems.map((item) => (
                  <li
                    key={item.item_code}
                    style={{ cursor: "pointer", padding: "8px 12px", fontSize: 14, color: "var(--mantine-color-text)" }}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevents input from losing focus immediately BEFORE the click fires
                      setManualCode("");
                      onScan(item.item_code);
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--mantine-color-gray-light-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{item.item_code}</span>
                      {item.vendor_code && (
                        <span style={{ borderRadius: "var(--mantine-radius-sm)", backgroundColor: "var(--mantine-color-gray-light)", padding: "2px 6px", fontSize: 10, fontWeight: 500, color: "var(--mantine-color-dimmed)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                          {item.vendor_code}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--mantine-color-dimmed)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</div>
                  </li>
                ))}
              </ul>
            )}
            
            {/* No items found visual cue */}
            {isFocused && manualCode.trim().length > 0 && filteredItems.length === 0 && items && (
              <div style={{ position: "absolute", left: 0, marginTop: 4, width: "100%", borderRadius: "var(--mantine-radius-md)", border: "1px solid var(--mantine-color-default-border)", backgroundColor: "var(--mantine-color-body)", boxShadow: "var(--mantine-shadow-md)", zIndex: 50, padding: 12, fontSize: 14, color: "var(--mantine-color-dimmed)", textAlign: "center" }}>
                No items found
              </div>
            )}
          </div>
          <Button type="submit" disabled={!manualCode.trim()}>
            Enter
          </Button>
        </form>
      )}
    </Stack>
  );
}
