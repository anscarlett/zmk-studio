import {
  CSSProperties,
  PropsWithChildren,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Key } from "./Key";

export type KeyPosition = PropsWithChildren<{
  id: string;
  header?: string;
  footer?: React.ReactNode;
  width: number;
  height: number;
  x: number;
  y: number;
  r?: number;
  rx?: number;
  ry?: number;
}>;

export type LayoutZoom = number | "auto";

export function deserializeLayoutZoom(value: string): LayoutZoom {
  if (value === "auto") {
    return "auto";
  }
  return parseFloat(value) || "auto";
}

interface PhysicalLayoutProps {
  positions: Array<KeyPosition>;
  selectedPosition?: number;
  oneU?: number;
  hoverZoom?: boolean;
  zoom?: LayoutZoom;
  onPositionClicked?: (position: number) => void;
}

interface PhysicalLayoutPositionLocation {
  x: number;
  y: number;
  r?: number;
  rx?: number;
  ry?: number;
}

// Fraction of the smaller viewport dimension used as padding around the
// keyboard in auto-fit mode.
const AUTO_MODE_PADDING_RATIO = 0.05;

function scalePosition(
  { x, y, r, rx, ry }: PhysicalLayoutPositionLocation,
  oneU: number,
): CSSProperties {
  let left = x * oneU;
  let top = y * oneU;
  let transformOrigin = undefined;
  let transform = undefined;
  const transformStyle = "preserve-3d";

  if (r) {
    // Use `??` so an explicit rotation origin of 0 is honored; `rx || x`
    // collapsed a legitimate 0 back to the key's own position, pivoting the
    // key around its own corner instead of the layout origin (#97).
    let transformX = ((rx ?? x) - x) * oneU;
    let transformY = ((ry ?? y) - y) * oneU;
    transformOrigin = `${transformX}px ${transformY}px`;
    transform = `rotate(${r}deg)`;
  }

  return {
    top,
    left,
    transformOrigin,
    transform,
    transformStyle,
  };
}

export const PhysicalLayout = ({
  positions,
  selectedPosition,
  oneU = 48,
  onPositionClicked,
  zoom,
}: PhysicalLayoutProps) => {
  const keyboardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(typeof zoom === "number" ? zoom : 1);

  // Natural dimensions using the base oneU — memoized so the effect only
  // re-runs when positions or the base oneU truly change.
  const rightMost = useMemo(
    () => positions.map((k) => k.x + k.width).reduce((a, b) => Math.max(a, b), 0),
    [positions],
  );
  const bottomMost = useMemo(
    () => positions.map((k) => k.y + k.height).reduce((a, b) => Math.max(a, b), 0),
    [positions],
  );
  const naturalWidth = useMemo(() => rightMost * oneU, [rightMost, oneU]);
  const naturalHeight = useMemo(() => bottomMost * oneU, [bottomMost, oneU]);

  useLayoutEffect(() => {
    if (zoom !== "auto") {
      setScale(zoom || 1);
      return;
    }

    // Observe the keyboard's parent container (the grid cell in Keyboard.tsx),
    // not the keyboard div itself — the keyboard div's size changes with scale,
    // so observing it would create a resize feedback loop.
    const container = keyboardRef.current?.parentElement;
    if (!container) return;

    const calculateScale = () => {
      const padding = Math.min(window.innerWidth, window.innerHeight) * AUTO_MODE_PADDING_RATIO;
      setScale(
        Math.min(
          container.clientWidth / (naturalWidth + 2 * padding),
          container.clientHeight / (naturalHeight + 2 * padding),
        ),
      );
    };

    calculateScale();
    const observer = new ResizeObserver(calculateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [zoom, naturalWidth, naturalHeight]);

  // Scale oneU directly so the keyboard div's actual DOM size equals its
  // visual size — no CSS transform needed. This means the keyboard can be
  // centered naturally (auto mode) or made scrollable (fixed zoom > 1)
  // without any transform/layout mismatch.
  const effectiveOneU = oneU * scale;

  const positionItems = positions.map((p, idx) => (
    <div key={p.id} className="absolute hover:z-10" style={scalePosition(p, effectiveOneU)}>
      <div
        onClick={() => onPositionClicked?.(idx)}
      >
        <Key
          oneU={effectiveOneU}
          selected={idx === selectedPosition}
          {...p}
        />
      </div>
    </div>
  ));

  // TODO: Add a bit of padding for rotation when supported
  return (
    <div
      className="relative"
      ref={keyboardRef}
      style={{
        height: bottomMost * effectiveOneU + "px",
        width: rightMost * effectiveOneU + "px",
        transformStyle: "preserve-3d",
      }}
    >
      {positionItems}
    </div>
  );
};
