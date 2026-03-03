import { ActionTypes } from "./constants";
import { PageSection, ComponentSchema, StylingTabValues, TStoredThemeStyles, ControlsTabValues, PortalTag, CustomHtmlPayload, ReferenceOverlayState, ServerResponsesMockConfig, ServerResponseFormItem, FontItem } from "./types";

export const setPages = (pages: PageSection[]) => ({
    type: ActionTypes.SET_PAGES,
    payload: pages,
});

export const setCurrentPage = (page: string | null) => ({
    type: ActionTypes.SET_CURRENT_PAGE,
    payload: page,
});

export const setComponentSchema = (schema: ComponentSchema | null) => ({
    type: ActionTypes.SET_COMPONENT_SCHEMA,
    payload: schema,
});

export const updateStyleSchemaDefaults = () => ({
    type: ActionTypes.UPDATE_STYLE_SCHEMA_DEFAULTS,
});

export const updateControlsTabValues = (values: ControlsTabValues) => ({
    type: ActionTypes.UPDATE_CONTROLS_TAB_VALUES,
    payload: values,
});

export const updateStylingTabValues = (values: StylingTabValues) => ({
    type: ActionTypes.UPDATE_STYLE_TAB_VALUES,
    payload: values,
});

export const setServerResponsesMocks = (mocks: ServerResponsesMockConfig[]) => ({
    type: ActionTypes.SET_SERVER_RESPONSES_MOCKS,
    payload: mocks,
});

export const setServerResponsesTabFormItems = (formItems: ServerResponseFormItem[]) => ({
    type: ActionTypes.SET_SERVER_RESPONSES_TAB_FORM_ITEMS,
    payload: formItems,
});

export const setServerResponsesTabExpandedAccordions = (expandedAccordions: string[]) => ({
    type: ActionTypes.SET_SERVER_RESPONSES_TAB_EXPANDED_ACCORDIONS,
    payload: expandedAccordions,
});

export const updateStylingTabValuesWithDefault = (values: StylingTabValues) => ({
    type: ActionTypes.UPDATE_STYLE_TAB_VALUES_WITH_DEFAULT,
    payload: values,
});

export const updateStylingTabToDefaultValues = () => ({
    type: ActionTypes.UPDATE_STYLE_TAB_TO_DEFAULT_VALUES,
});

export const updateStylingTabToPreviousValues = () => ({
    type: ActionTypes.UPDATE_STYLE_TAB_TO_PREVIOUS_VALUES,
});

export const updateStylingTabDefaultValues = () => ({
    type: ActionTypes.UPDATE_STYLE_TAB_DEFAULT_VALUES,
});

export const setStylingTabUIState = (uiState: { scrollPosition?: number; expandedAccordions?: string[] }) => ({
    type: ActionTypes.SET_STYLING_TAB_UI_STATE,
    payload: uiState,
});

export const saveStylingTheme = (stylingTheme: TStoredThemeStyles) => ({
    type: ActionTypes.SET_STYLING_THEME,
    payload: stylingTheme,
});

export const setCustomCss = (css: string) => ({
    type: ActionTypes.SET_CUSTOM_CSS,
    payload: css,
});

export const setCustomJs = (js: string) => ({
    type: ActionTypes.SET_CUSTOM_JS,
    payload: js,
});

export const setCustomHtml = (html: CustomHtmlPayload) => ({
    type: ActionTypes.SET_CUSTOM_HTML,
    payload: html,
});

export const setZoom = (zoom: number) => ({
    type: ActionTypes.SET_ZOOM,
    payload: zoom,
});

export const setViewport = (viewport: "desktop" | "tablet" | "mobile") => ({
    type: ActionTypes.SET_VIEWPORT,
    payload: viewport,
});

export const setViewportRotated = (viewportRotated: boolean) => ({
    type: ActionTypes.SET_VIEWPORT_ROTATED,
    payload: viewportRotated,
});

export const setDirection = (direction: "ltr" | "rtl") => ({
    type: ActionTypes.SET_DIRECTION,
    payload: direction,
});

export const setPanelDock = (dock: "bottom") => ({
    type: ActionTypes.SET_PANEL_DOCK,
    payload: dock,
});

export const toggleCodeEditorSidebar = () => ({
    type: ActionTypes.TOGGLE_CODE_EDITOR_SIDEBAR,
});

export const toggleTestSidebar = () => ({
    type: ActionTypes.TOGGLE_TEST_SIDEBAR,
});

export const setSearchQuery = (query: string) => ({
    type: ActionTypes.SET_SEARCH_QUERY,
    payload: query,
});

export const setLoading = (loading: boolean) => ({
    type: ActionTypes.SET_LOADING,
    payload: loading,
});

export const setError = (error: string | null) => ({
    type: ActionTypes.SET_ERROR,
    payload: error,
});

export const setPortalTags = (tags: PortalTag[]) => ({
    type: ActionTypes.SET_PORTAL_TAGS,
    payload: tags,
});

export const setPortalTagsEnabled = (enabled: boolean) => ({
    type: ActionTypes.SET_PORTAL_TAGS_ENABLED,
    payload: enabled,
});

export const setPreviewBackgroundColor = (color: string) => ({
    type: ActionTypes.SET_PREVIEW_BACKGROUND_COLOR,
    payload: color,
});

export const setSiteTheme = (themeName: string, themeUrl: string) => ({
    type: ActionTypes.SET_SITE_THEME,
    payload: { themeName, themeUrl },
});

export const setPortalIcons = (icons: Record<string, string>) => ({
    type: ActionTypes.SET_PORTAL_ICONS,
    payload: icons,
});

export const setReferenceOverlay = (overlay: ReferenceOverlayState | null) => ({
    type: ActionTypes.SET_REFERENCE_OVERLAY,
    payload: overlay,
});

export const refreshIframe = () => ({
    type: ActionTypes.REFRESH_IFRAME,
});

export const setFonts = (fonts: FontItem[]) => ({
    type: ActionTypes.SET_FONTS,
    payload: fonts,
});

export const setShowTranslationKeys = (show: boolean) => ({
    type: ActionTypes.SET_SHOW_TRANSLATION_KEYS,
    payload: show,
});
