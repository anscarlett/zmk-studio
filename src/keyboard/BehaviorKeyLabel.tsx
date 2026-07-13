import { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type {
  GetBehaviorDetailsResponse,
  BehaviorParameterValueDescription,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { HidUsageLabel } from "./HidUsageLabel";

/**
 * Renders a single parameter value as a label, using the parameter's type
 * metadata to decide how to display it (HID usage, layer name, or constant name).
 */
function ParamLabel({
  value,
  paramDescriptions,
  layers,
}: {
  value: number;
  paramDescriptions: BehaviorParameterValueDescription[];
  layers: { id: number; name: string }[];
}) {
  if (paramDescriptions.length === 0 || value === 0) {
    return null;
  }

  // If all options are constants, look up the constant name
  if (paramDescriptions.every((d) => d.constant !== undefined)) {
    const match = paramDescriptions.find((d) => d.constant === value);
    return <span>{match?.name ?? value}</span>;
  }

  const desc = paramDescriptions[0];

  if (desc.hidUsage) {
    return <HidUsageLabel hid_usage={value} />;
  }

  if (desc.layerId) {
    const layer = layers.find((l) => l.id === value);
    return <span>{layer?.name ?? `Layer ${value}`}</span>;
  }

  if (desc.range) {
    return <span>{value}</span>;
  }

  return null;
}

/**
 * Returns the parameter descriptions for param1 and param2 from the first
 * matching metadata set for the given binding.
 */
function getParamDescriptions(
  behavior: GetBehaviorDetailsResponse | undefined,
  param1: number | undefined
): {
  param1Descs: BehaviorParameterValueDescription[];
  param2Descs: BehaviorParameterValueDescription[];
} {
  if (!behavior) {
    return { param1Descs: [], param2Descs: [] };
  }

  // Use the first metadata set as a default; prefer one whose param1 constants
  // contain the current param1 value when available.
  const set =
    behavior.metadata.find((s) =>
      s.param1.some((d) => d.constant !== undefined && d.constant === param1)
    ) ?? behavior.metadata[0];

  return {
    param1Descs: set?.param1 ?? [],
    param2Descs: set?.param2 ?? [],
  };
}

/**
 * Produces the primary (children) and secondary (footer) labels for a key
 * based on the binding and behavior metadata.
 *
 * - Primary label represents param1 (e.g. the tap key for mod-tap).
 * - Footer label represents param2 when the behavior uses it (e.g. the hold
 *   modifier for mod-tap, or the hold layer for layer-tap).
 */
export function getBehaviorKeyLabel(
  binding: BehaviorBinding,
  behavior: GetBehaviorDetailsResponse | undefined,
  layers: { id: number; name: string }[]
): { primary: React.ReactNode; footer: React.ReactNode } {
  const { param1Descs, param2Descs } = getParamDescriptions(
    behavior,
    binding.param1
  );

  const primary =
    param1Descs.length > 0 ? (
      <ParamLabel
        value={binding.param1}
        paramDescriptions={param1Descs}
        layers={layers}
      />
    ) : null;

  const hasParam2 = param2Descs.length > 0 && binding.param2 !== 0;
  const footer = hasParam2 ? (
    <ParamLabel
      value={binding.param2}
      paramDescriptions={param2Descs}
      layers={layers}
    />
  ) : null;

  return { primary, footer };
}
