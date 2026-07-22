export interface PageItem {
    title: string;
    path?: string;
    icon?: string;
    items?: PageItem[];
    schemaPath?: string | string[];
    cssVariablesPath?: string;
}

export interface PageSection {
    sectionTitle: string;
    items: PageItem[];
}

export interface SchemaMock {
    url: string;
    requestId: number;
    description: string;
    response: unknown;
    responseType?: ServerResponseType;
    delay?: number;
}

export type ServerResponseType = "success" | "error";

export interface ServerResponsesMockConfig {
    url: string;
    requestId: number;
    response: unknown;
    responseType: ServerResponseType;
    delay?: number;
}

export interface ServerResponseFormItem {
    url: string;
    requestId: number;
    description: string;
    isEnabled: boolean;
    responseType: ServerResponseType;
    responseDelay: string;
    responseBody: string;
    responseBodyError: string | null;
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

export type StyleSchemasConfig = Record<string, string>;

export type StylesObjectMap = Record<
    string,
    (StyleField | StyleGroup)[] | string
>;

export interface ComponentSchema {
    controls: ControlField[];
    styles: (StyleField | StyleGroup)[] | StylesObjectMap;
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

export interface FontItem {
    name: string;
    type: "file" | "import" | "default";
    fontStyle?: string;
    fontWeight?: string;
    fontDisplay?: string;
    unicodeRange?: string;
    url?: string;
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
    serverResponsesTabFormItems: ServerResponseFormItem[];
    serverResponsesTabExpandedAccordions: string[];
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
    iframeRefreshKey: number;
    fonts: FontItem[];
    showTranslationKeys: boolean;
    stylesMap: StylesObjectMap | null;
    styleSchemasConfig: StyleSchemasConfig | null;
    elementHighlightActive: boolean;
    selectedStyleSchemaName: string | null;
    selectedElementStyles: (StyleField | StyleGroup)[] | null;
}
