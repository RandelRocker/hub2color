export interface PageItem {
    title: string;
    path: string;
    icon?: string;
}

export interface PageSection {
    sectionTitle: string;
    items: PageItem[];
}

export interface ControlField {
    name: string;
    label: string;
    description: string;
    type:
        | "text"
        | "number"
        | "boolean"
        | "select"
        | "multi-select"
        | "radio"
        | "color"
        | "slider";
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
}

export interface ControlsSchema {
    version: number;
    defaults: Record<string, unknown>;
    fields: ControlField[];
}

export interface AppState {
    pages: PageSection[];
    currentPage: string | null;
    controlsSchema: ControlsSchema | null;
    controlValues: Record<string, unknown>;
    stylingValues: Record<string, unknown>;
    customCss: string;
    customJs: string;
    zoom: number;
    viewport: "desktop" | "tablet" | "mobile";
    direction: "ltr" | "rtl";
    panelDock: "bottom" | "right";
    searchQuery: string;
    loading: boolean;
    error: string | null;
}
