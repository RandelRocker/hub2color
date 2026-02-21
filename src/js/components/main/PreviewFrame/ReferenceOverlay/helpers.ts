import { ReferenceOverlayState } from "../../../../store/types";
import { REFERENCE_OVERLAY_MIN_SIZE } from "./constants";
import { ResizeHandle } from "./types";

const clampSize = (value: number) => Math.max(REFERENCE_OVERLAY_MIN_SIZE, Math.round(value));

export const getHandleCursor = (handle: ResizeHandle): string => {
    switch (handle) {
        case "n":
        case "s":
            return "ns-resize";
        case "e":
        case "w":
            return "ew-resize";
        case "ne":
        case "sw":
            return "nesw-resize";
        case "nw":
        case "se":
            return "nwse-resize";
        default:
            return "default";
    }
};

export const getHandleStyles = (handle: ResizeHandle): Record<string, string | number> => {
    const base = {
        position: "absolute" as const,
        width: 10,
        height: 10,
        border: "1px solid #1976d2",
        backgroundColor: "#ffffff",
        borderRadius: 2
    };

    switch (handle) {
        case "n":
            return { ...base, top: -6, left: "50%", transform: "translateX(-50%)" };
        case "s":
            return { ...base, bottom: -6, left: "50%", transform: "translateX(-50%)" };
        case "e":
            return { ...base, top: "50%", right: -6, transform: "translateY(-50%)" };
        case "w":
            return { ...base, top: "50%", left: -6, transform: "translateY(-50%)" };
        case "ne":
            return { ...base, top: -6, right: -6 };
        case "nw":
            return { ...base, top: -6, left: -6 };
        case "se":
            return { ...base, bottom: -6, right: -6 };
        case "sw":
            return { ...base, bottom: -6, left: -6 };
        default:
            return base;
    }
};

export const getNextDragOverlay = (
    overlay: ReferenceOverlayState,
    deltaX: number,
    deltaY: number
): ReferenceOverlayState => {
    return {
        ...overlay,
        position: {
            x: Math.round(overlay.position.x + deltaX),
            y: Math.round(overlay.position.y + deltaY)
        }
    };
};

const getNextResizeOverlayUnlocked = (
    overlay: ReferenceOverlayState,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number
): { nextX: number; nextY: number; nextWidth: number; nextHeight: number } => {
    let nextX = overlay.position.x;
    let nextY = overlay.position.y;
    let nextWidth = overlay.size.width;
    let nextHeight = overlay.size.height;

    if (handle.includes("e")) {
        nextWidth = clampSize(overlay.size.width + deltaX);
    }
    if (handle.includes("s")) {
        nextHeight = clampSize(overlay.size.height + deltaY);
    }
    if (handle.includes("w")) {
        const proposedWidth = overlay.size.width - deltaX;
        nextWidth = clampSize(proposedWidth);
        nextX = Math.round(overlay.position.x + (overlay.size.width - nextWidth));
    }
    if (handle.includes("n")) {
        const proposedHeight = overlay.size.height - deltaY;
        nextHeight = clampSize(proposedHeight);
        nextY = Math.round(overlay.position.y + (overlay.size.height - nextHeight));
    }

    return { nextX, nextY, nextWidth, nextHeight };
};

export const getNextResizeOverlay = (
    overlay: ReferenceOverlayState,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    lockAspectRatio = false
): ReferenceOverlayState => {
    const { nextX, nextY, nextWidth, nextHeight } = getNextResizeOverlayUnlocked(
        overlay,
        handle,
        deltaX,
        deltaY
    );

    if (!lockAspectRatio) {
        return {
            ...overlay,
            position: { x: nextX, y: nextY },
            size: { width: nextWidth, height: nextHeight }
        };
    }

    const scaleW = nextWidth / overlay.size.width;
    const scaleH = nextHeight / overlay.size.height;
    const scale = (scaleW + scaleH) / 2;
    const lockedWidth = clampSize(overlay.size.width * scale);
    const lockedHeight = clampSize(overlay.size.height * scale);

    let finalX = nextX;
    let finalY = nextY;
    if (handle.includes("w")) {
        finalX = Math.round(overlay.position.x + (overlay.size.width - lockedWidth));
    }
    if (handle.includes("n")) {
        finalY = Math.round(overlay.position.y + (overlay.size.height - lockedHeight));
    }

    return {
        ...overlay,
        position: { x: finalX, y: finalY },
        size: { width: lockedWidth, height: lockedHeight }
    };
};
