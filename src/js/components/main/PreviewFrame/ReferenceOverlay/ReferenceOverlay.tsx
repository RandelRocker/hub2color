import { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Input,
    Menu,
    MenuItem,
    Slider,
    IconButton,
    Tooltip,
    Typography
} from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";

import { createReferenceOverlayFromFile } from "../../../../utils/referenceOverlay";
import {
    getHandleCursor,
    getHandleStyles,
    getNextDragOverlay,
    getNextResizeOverlay
} from "./helpers";
import { RESIZE_HANDLES } from "./constants";
import { InteractionState, ReferenceOverlayProps, ResizeHandle } from "./types";

interface LiveTransform {
    position: { x: number; y: number };
    size: { width: number; height: number };
}

export const ReferenceOverlay = ({ overlay, onChange, onDelete }: ReferenceOverlayProps) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const interactionRef = useRef<InteractionState | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const rafScheduledRef = useRef(false);
    const lastPointerRef = useRef({ clientX: 0, clientY: 0 });
    const lockAspectRatioRef = useRef(false);

    const [isSelected, setIsSelected] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    const [interactionMode, setInteractionMode] = useState<"drag" | "resize" | null>(null);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [liveTransform, setLiveTransform] = useState<LiveTransform | null>(null);

    const displayPosition = liveTransform?.position ?? overlay.position;
    const displaySize = liveTransform?.size ?? overlay.size;

    useEffect(() => {
        const handleOutsideMouseDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setIsSelected(false);
                setMenuAnchorEl(null);
            }
        };

        document.addEventListener("mousedown", handleOutsideMouseDown);
        return () => {
            document.removeEventListener("mousedown", handleOutsideMouseDown);
        };
    }, []);

    const applyInteractionMove = useCallback(() => {
        const interaction = interactionRef.current;
        if (!interaction) {
            return;
        }

        const { clientX, clientY } = lastPointerRef.current;
        const deltaX = clientX - interaction.startMouseX;
        const deltaY = clientY - interaction.startMouseY;

        if (interaction.mode === "drag") {
            const next = getNextDragOverlay(interaction.startOverlay, deltaX, deltaY);
            setLiveTransform({ position: next.position, size: next.size });
            return;
        }

        if (interaction.mode === "resize" && interaction.handle) {
            const next = getNextResizeOverlay(
                interaction.startOverlay,
                interaction.handle,
                deltaX,
                deltaY,
                lockAspectRatioRef.current
            );
            setLiveTransform({ position: next.position, size: next.size });
        }
    }, []);

    const handleInteractionMove = useCallback((event: MouseEvent | React.MouseEvent<HTMLDivElement>) => {
        const interaction = interactionRef.current;
        if (!interaction) {
            return;
        }

        lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
        if (interaction.mode === "resize") {
            lockAspectRatioRef.current = event.metaKey || event.shiftKey;
        }

        if (!rafScheduledRef.current) {
            rafScheduledRef.current = true;
            requestAnimationFrame(() => {
                rafScheduledRef.current = false;
                applyInteractionMove();
            });
        }
    }, [applyInteractionMove]);

    const handleInteractionEnd = useCallback(() => {
        const interaction = interactionRef.current;
        if (interaction) {
            const deltaX = lastPointerRef.current.clientX - interaction.startMouseX;
            const deltaY = lastPointerRef.current.clientY - interaction.startMouseY;
            const finalOverlay =
                interaction.mode === "drag"
                    ? getNextDragOverlay(interaction.startOverlay, deltaX, deltaY)
                    : interaction.handle
                        ? getNextResizeOverlay(
                              interaction.startOverlay,
                              interaction.handle,
                              deltaX,
                              deltaY,
                              lockAspectRatioRef.current
                          )
                        : overlay;
            onChange(finalOverlay);
        }
        interactionRef.current = null;
        setLiveTransform(null);
        setInteractionMode(null);
        setResizeHandle(null);
        setIsInteracting(false);
    }, [onChange, overlay]);

    useEffect(() => {
        if (!isInteracting) {
            return;
        }

        window.addEventListener("mousemove", handleInteractionMove);
        window.addEventListener("mouseup", handleInteractionEnd);

        return () => {
            window.removeEventListener("mousemove", handleInteractionMove);
            window.removeEventListener("mouseup", handleInteractionEnd);
        };
    }, [isInteracting, handleInteractionMove, handleInteractionEnd]);

    const startDrag = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) {
            return;
        }

        if (!rootRef.current?.contains(event.target as Node)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        setIsSelected(true);
        setMenuAnchorEl(null);

        lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
        interactionRef.current = {
            mode: "drag",
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startOverlay: overlay
        };
        setInteractionMode("drag");
        setResizeHandle(null);
        setIsInteracting(true);
    };

    const startResize = (
        handle: ResizeHandle,
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        event.preventDefault();
        event.stopPropagation();
        setIsSelected(true);
        setMenuAnchorEl(null);

        lastPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
        lockAspectRatioRef.current = event.metaKey || event.shiftKey;
        interactionRef.current = {
            mode: "resize",
            handle,
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startOverlay: overlay
        };
        setInteractionMode("resize");
        setResizeHandle(handle);
        setIsInteracting(true);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setIsSelected(true);
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleResetSize = () => {
        onChange({
            ...overlay,
            size: {
                width: overlay.naturalSize.width,
                height: overlay.naturalSize.height
            }
        });
        setMenuAnchorEl(null);
    };

    const handleOpacityChange = (_event: Event, value: number | number[]) => {
        if (typeof value !== "number") {
            return;
        }

        onChange({
            ...overlay,
            opacity: value
        });
    };

    const handleChangeImageClick = () => {
        fileInputRef.current?.click();
        setMenuAnchorEl(null);
    };

    const handleChangeImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFile = event.target.files?.[0];
        if (!nextFile) {
            return;
        }

        const nextOverlay = await createReferenceOverlayFromFile(nextFile);
        if (!nextOverlay) {
            event.target.value = "";
            return;
        }

        onChange({
            ...nextOverlay,
            position: overlay.position,
            opacity: overlay.opacity
        });
        event.target.value = "";
    };

    const handleDelete = () => {
        setMenuAnchorEl(null);
        setIsSelected(false);
        onDelete();
    };

    const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        event.stopPropagation();
        setIsSelected(false);
        setMenuAnchorEl(null);
    };

    return (
        <>
            {isSelected && (
                <Box
                    aria-hidden
                    onMouseDown={handleBackdropMouseDown}
                    sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        cursor: "default"
                    }}
                />
            )}
            <Box
                ref={rootRef}
                onMouseDown={startDrag}
                sx={{
                    top: displayPosition.y,
                    left: displayPosition.x,
                    width: displaySize.width,
                    height: displaySize.height,
                    zIndex: isSelected ? 4 : 3,
                    userSelect: "none",
                    borderRadius: 0.5,
                    position: "absolute",
                    border: isSelected ? "1px dashed #1976d2" : "1px solid transparent",
                    cursor: isInteracting ? "grabbing" : "grab"
                }}
            >
            <Box
                component="img"
                src={overlay.imageSrc}
                alt="Reference overlay"
                draggable={false}
                sx={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "fill",
                    pointerEvents: "none",
                    opacity: overlay.opacity
                }}
            />

            {isSelected && (
                <>
                    <Tooltip title="Overlay options">
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            onMouseDown={(event) => event.stopPropagation()}
                            sx={{
                                top: -32,
                                right: 0,
                                zIndex: 5,
                                position: "absolute"
                            }}
                        >
                            <MoreHoriz fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {RESIZE_HANDLES.map((handle) => {
                        const handleBox = (
                            <Box
                                key={handle}
                                onMouseDown={(event: React.MouseEvent<HTMLDivElement>) =>
                                    startResize(handle, event)
                                }
                                sx={{
                                    zIndex: 5,
                                    cursor: getHandleCursor(handle),
                                    ...getHandleStyles(handle)
                                }}
                            />
                        );
                        return handle === "se" ? (
                            <Tooltip
                                key={handle}
                                title="Hold ⌘ or Shift while dragging to keep aspect ratio"
                                placement="top"
                            >
                                {handleBox}
                            </Tooltip>
                        ) : (
                            handleBox
                        );
                    })}
                </>
            )}

            <Menu
                open={Boolean(menuAnchorEl)}
                anchorEl={menuAnchorEl}
                onClose={handleMenuClose}
                onMouseDown={(event) => event.stopPropagation()}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <MenuItem onClick={handleResetSize} sx={{ fontSize: "0.875rem" }}>
                    Reset to default size
                </MenuItem>
                <Box sx={{ px: 2, pt: 0.5, width: 220 }} onMouseDown={(event) => event.stopPropagation()}>
                    <Typography variant="caption" color="text.secondary">
                        Opacity
                    </Typography>
                    <Slider
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={overlay.opacity}
                        onChange={handleOpacityChange}
                    />
                </Box>
                <MenuItem onClick={handleChangeImageClick} sx={{ fontSize: "0.875rem" }}>
                    Change image
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ fontSize: "0.875rem", color: "error.main" }}>
                    Delete image
                </MenuItem>
            </Menu>

            <Input
                type="file"
                inputRef={fileInputRef}
                inputProps={{ accept: "image/*" }}
                onChange={handleChangeImage}
                sx={{ display: "none" }}
            />

            {isInteracting && (
                <Box
                    onMouseMove={handleInteractionMove}
                    onMouseUp={handleInteractionEnd}
                    sx={{
                        inset: 0,
                        zIndex: 1600,
                        position: "fixed",
                        cursor:
                            interactionMode === "drag"
                                ? "grabbing"
                                : resizeHandle
                                    ? getHandleCursor(resizeHandle)
                                    : "default"
                    }}
                />
            )}
        </Box>
        </>
    );
};
