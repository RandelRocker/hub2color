export interface PageItem {
    title: string;
    path?: string;
    icon?: string;
    items?: PageItem[];
}

export interface PageSection {
    sectionTitle: string;
    items: PageItem[];
}

export interface ControlField {
    id: string;
    label: string;
    defaultValue?: string | number | boolean;
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

export interface StylingTabValues {
    [cssVariable: string]: {
        id: string;
        isEnabled: boolean;
        value: unknown;
        themeKey?: string;
    };
}

export interface ControlsTabValues {
    [name: string]: unknown
}

export interface StoredThemeStyles {
    [cssVariable: string]: {
        isEnabled: boolean;
        value: unknown;
        themeKey?: string;
    }
}

export interface ControlsSchemaProps {
    fields: ControlField[];
}

export interface ControlsSchema {
    version?: number;
    fields?: ControlField[];
}

export interface StyleField {
    id: string;
    label: string;
    type: string;
    defaultValue?: string | number | boolean;
    themeKey?: string;
    cssVariable: string;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    checkedValue?: string;
    uncheckedValue?: string;
    fields?: StyleField[];
}

export interface StyleGroup {
    type: "group" | "sectionTitle" | "groupTitle";
    id?: string;
    label: string;
    fields?: (StyleField | StyleGroup)[];
}

export interface StyleSchema {
    styles: (StyleField | StyleGroup)[];
}

export interface ComponentSchema {
    controls: ControlField[];
    styles: (StyleField | StyleGroup)[];
}

export interface AppState {
    pages: PageSection[];
    currentPage: string | null;
    componentSchema: ComponentSchema | null;
    controlsTabValues: ControlsTabValues;
    controlsTabDefaultValues: ControlsTabValues;
    styleTabValues: StylingTabValues;
    styleTabDefaultValues: Record<string, unknown>;
    savedTheme: StoredThemeStyles | null;
    stylingUIState: { scrollPosition?: number; expandedAccordions?: string[] };
    customCss: string;
    customJs: string;
    zoom: number;
    viewport: "desktop" | "tablet" | "mobile";
    direction: "ltr" | "rtl";
    panelDock: "bottom";
    codeEditorSidebarOpen: boolean;
    searchQuery: string;
    loading: boolean;
    error: string | null;
}
