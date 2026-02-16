import { ReferenceOverlayState } from "../store/types";

const DEFAULT_IMAGE_OFFSET = 16;

const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
                return;
            }

            reject(new Error("Failed to read image data"));
        };
        reader.onerror = () => reject(new Error("Failed to read image data"));
        reader.readAsDataURL(file);
    });
};

const loadImageDimensions = (imageSrc: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            resolve({
                width: image.naturalWidth,
                height: image.naturalHeight
            });
        };
        image.onerror = () => reject(new Error("Failed to read image dimensions"));
        image.src = imageSrc;
    });
};

function isImageFile(file: File): boolean {
    if (file.type.startsWith("image/")) {
        return true;
    }
    if (file.size === 0) {
        return false;
    }
    return true;
}

export const createReferenceOverlayFromFile = async (file: File): Promise<ReferenceOverlayState | null> => {
    if (!isImageFile(file)) {
        return null;
    }

    let imageSrc: string;
    try {
        imageSrc = await readFileAsDataUrl(file);
    } catch {
        return null;
    }
    if (!imageSrc.startsWith("data:image/")) {
        return null;
    }

    const dimensions = await loadImageDimensions(imageSrc);

    return {
        imageSrc,
        naturalSize: dimensions,
        size: dimensions,
        position: { x: DEFAULT_IMAGE_OFFSET, y: DEFAULT_IMAGE_OFFSET },
        opacity: 1
    };
};

export const getFirstImageFromClipboard = (event: ClipboardEvent): File | null => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
        return null;
    }

    const items = clipboardData.items;
    if (items?.length) {
        for (let i = 0; i < items.length; i += 1) {
            const item = items[i];
            if (item.kind !== "file") {
                continue;
            }
            const file = item.getAsFile();
            if (!file) {
                continue;
            }
            if (item.type.startsWith("image/") || file.type.startsWith("image/") || file.size > 0) {
                return file;
            }
        }
    }

    const files = clipboardData.files;
    if (files?.length) {
        for (let i = 0; i < files.length; i += 1) {
            const file = files.item(i);
            if (file && (file.type.startsWith("image/") || file.size > 0)) {
                return file;
            }
        }
    }

    return null;
};
