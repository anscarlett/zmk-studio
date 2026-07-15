import {
  hid_usage_get_labels,
  hid_usage_page_and_id_from_usage,
} from "../hid-usages";
import { resolveModifierPrefix } from "../behaviors/modifiers";

export interface HidUsageLabelProps {
  hid_usage: number;
}

function remove_prefix(s?: string) {
  return s?.replace(/^Keyboard /, "");
}

export const HidUsageLabel = ({ hid_usage }: HidUsageLabelProps) => {
  let [page, id] = hid_usage_page_and_id_from_usage(hid_usage);

  const modFlags = hid_usage >> 24;
  page &= 0xff;

  let labels = hid_usage_get_labels(page, id);
  const modPrefix = resolveModifierPrefix(modFlags);

  return (
    <span
      className="@[10em]:before:content-[attr(data-long-content)] @[6em]:before:content-[attr(data-med-content)] before:content-[attr(aria-label)]"
      aria-label={modPrefix + remove_prefix(labels.short)}
      data-med-content={modPrefix + remove_prefix(labels.med || labels.short)}
      data-long-content={
        modPrefix + remove_prefix(labels.long || labels.med || labels.short)
      }
    />
  );
};
