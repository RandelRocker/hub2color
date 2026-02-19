export interface PageItem {
    title: string;
    path?: string;
    icon?: string;
    items?: PageItem[];
    schemaPath?: string | string[];
}

export interface PageSection {
    sectionTitle: string;
    items: PageItem[];
}

export interface SchemaMock {
    requestId: number;
    description: string;
    response: unknown;
}

export type ServerResponseType = "success" | "error";

export interface ServerResponsesMockConfig {
    requestId: number;
    response: unknown;
    responseType: ServerResponseType;
    delay?: number;
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

export type TStoredThemeStyles = Record<string, string>;

export interface CustomHtmlPayload {
    beforeEndHead: string;
    beforeEndBody: string;
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
    mocks?: SchemaMock[];
}

export interface PortalTagCondition {
    conditionId: string;
    conditionTypeId: string;
    name: string;
    description: string;
    config: {
        launch: string;
    };
}

export interface PortalTag {
    tagId: string;
    tagTypeId: string;
    name: string;
    description: string;
    config: Record<string, unknown>;
    conditions: PortalTagCondition[];
}

export interface PortalTagRaw {
    tagId: string;
    tagTypeId: string;
    name: string;
    description: string;
    config: Record<string, unknown>;
    conditionIds: string[];
}

export interface ReferenceOverlayDimensions {
    width: number;
    height: number;
}

export interface ReferenceOverlayPosition {
    x: number;
    y: number;
}

export interface ReferenceOverlayState {
    imageSrc: string;
    naturalSize: ReferenceOverlayDimensions;
    size: ReferenceOverlayDimensions;
    position: ReferenceOverlayPosition;
    opacity: number;
}

export interface AppState {
    pages: PageSection[];
    currentPage: string | null;
    componentSchema: ComponentSchema | null;
    controlsTabValues: ControlsTabValues;
    controlsTabDefaultValues: ControlsTabValues;
    serverResponsesMocks: ServerResponsesMockConfig[];
    styleTabValues: StylingTabValues;
    styleTabDefaultValues: Record<string, unknown>;
    savedTheme: TStoredThemeStyles | null;
    stylingUIState: { scrollPosition?: number; expandedAccordions?: string[] };
    customCss: string;
    customJs: string;
    customHtml: CustomHtmlPayload;
    zoom: number;
    viewport: "desktop" | "tablet" | "mobile";
    viewportRotated: boolean;
    direction: "ltr" | "rtl";
    panelDock: "bottom";
    codeEditorSidebarOpen: boolean;
    testSidebarOpen: boolean;
    searchQuery: string;
    loading: boolean;
    error: string | null;
    portalTags: PortalTag[];
    portalTagsEnabled: boolean;
    previewBackgroundColor: string;
    themeName: string | null;
    themeUrl: string | null;
    portalIcons: Record<string, string>;
    referenceOverlay: ReferenceOverlayState | null;
}
