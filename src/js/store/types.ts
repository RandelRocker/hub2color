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

export interface ControlsSchemaProps {
    defaults: Record<string, unknown>;
    fields: ControlField[];
}

export interface ControlsSchemaTemplate {
    templateName: string;
    templateLabel: string;
    props: ControlsSchemaProps;
}

export interface ControlsSchema {
    version?: number;
    defaults?: Record<string, unknown>;
    fields?: ControlField[];
    templates?: ControlsSchemaTemplate[];
}

export interface StyleField {
    id: string;
    label: string;
    type: string;
    defaultValue?: string | number | boolean;
    themeKey: string;
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
    style: (StyleField | StyleGroup)[];
}

export interface AppState {
    pages: PageSection[];
    currentPage: string | null;
    controlsSchema: ControlsSchema | null;
    styleSchema: StyleSchema | null;
    styleSchemaDefaults: Record<string, unknown>;
    selectedTemplate: ControlsSchemaTemplate | null;
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
