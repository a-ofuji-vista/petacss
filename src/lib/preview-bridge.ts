import type { Theme } from "./theme.ts";

/** 親ページ ↔ Preview iframe 間の postMessage 種別 */
export const PREVIEW_BRIDGE_MSG = "petacss-preview-bridge" as const;

export type PreviewBridgeMessage =
  | {
      type: typeof PREVIEW_BRIDGE_MSG;
      action: "resize";
      height: number;
    }
  | {
      type: typeof PREVIEW_BRIDGE_MSG;
      action: "set-color-scheme";
      colorScheme: Theme;
    };

/** iframe 内で計測した高さの上限（resize スプーフィング対策） */
export const PREVIEW_MAX_HEIGHT = 10_000;
