import {
  CSSProperties,
  PropsWithChildren,
  useLayoutEffect,
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
  ...props
}: PhysicalLayoutProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = innerRef.current;
    const outer = outerRef.current;
    if (!element || !outer) return;

    // The outer wrapper's parent is the actual available container (from Keyboard.tsx).
    // We must observe this rather than the outer wrapper itself to avoid a resize loop.
    const availableContainer = outer.parentElement;
    if (!availableContainer) return;

    const calculateScale = () => {
      if (props.zoom === "auto") {
        const padding = Math.min(window.innerWidth, window.innerHeight) * 0.05; // Padding when in auto mode
        const newScale = Math.min(
          availableContainer.clientWidth / (element.clientWidth + 2 * padding),
          availableContainer.clientHeight / (element.clientHeight + 2 * padding),
        );
        setScale(newScale);
      } else {
        setScale(props.zoom || 1);
      }
    };

    calculateScale(); // Initial calculation

    const resizeObserver = new ResizeObserver(() => {
      calculateScale();
    });

    // Watch the available container (for window/layout resizes) and the inner
    // keyboard element (for natural-size changes when a different keyboard
    // is connected). Do NOT observe the outer wrapper — its size depends on
    // `scale`, so observing it would create a feedback loop.
    resizeObserver.observe(element);
    resizeObserver.observe(availableContainer);

    return () => {
      resizeObserver.disconnect();
    };
  }, [props.zoom]);

  // TODO: Add a bit of padding for rotation when supported
  let rightMost = positions
    .map((k) => k.x + k.width)
    .reduce((a, b) => Math.max(a, b), 0);
  let bottomMost = positions
    .map((k) => k.y + k.height)
    .reduce((a, b) => Math.max(a, b), 0);

  const naturalWidth = rightMost * oneU;
  const naturalHeight = bottomMost * oneU;

  const positionItems = positions.map((p, idx) => (
    <div key={p.id} className="absolute hover:z-10" style={scalePosition(p, oneU)}>
      <div
        onClick={() => onPositionClicked?.(idx)}
      >
        <Key
          oneU={oneU}
          selected={idx === selectedPosition}
          {...p}
        />
      </div>
    </div>
  ));

  return (
    // Outer wrapper reserves the correct layout space for the scaled keyboard.
    // Without this, CSS transform: scale() would not affect layout flow and the
    // element would appear to overflow its container while the layout space stays
    // at the natural (unscaled) size, causing visible content to be clipped.
    <div
      ref={outerRef}
      style={{
        width: naturalWidth * scale + "px",
        height: naturalHeight * scale + "px",
      }}
      {...props}
    >
      <div
        ref={innerRef}
        className="relative"
        style={{
          height: naturalHeight + "px",
          width: naturalWidth + "px",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          transformStyle: "preserve-3d",
        }}
      >
        {positionItems}
      </div>
    </div>
  );
};
