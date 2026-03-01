export enum DialogStep {
    FONT_LIST = "fontList",
    FONT_FORM = "fontForm",
}

export type FontSourceType = "file" | "import";

export interface FontFileFormState {
    fontName: string;
    fontStyle: string;
    fontWeight: string[];
    fontDisplay: string;
    unicodeRange: string;
    fontFile: File | null;
}

export interface GoogleFontFormState {
    googleFontLink: string;
}

export interface FontFormState {
    sourceType: FontSourceType;
    fontFile: FontFileFormState;
    googleFont: GoogleFontFormState;
}
