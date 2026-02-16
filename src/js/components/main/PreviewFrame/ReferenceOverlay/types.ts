import { ReferenceOverlayState } from "../../../../store/types";

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export interface ReferenceOverlayProps {
    overlay: ReferenceOverlayState;
    onChange: (nextOverlay: ReferenceOverlayState) => void;
    onDelete: () => void;
}

export interface InteractionState {
    mode: "drag" | "resize";
    handle?: ResizeHandle;
    startMouseX: number;
    startMouseY: number;
    startOverlay: ReferenceOverlayState;
}
