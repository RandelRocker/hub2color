import { produce } from "immer";
import { ActionTypes } from "./constants";
import { AppState, TStoredThemeStyles, StyleField, StyleGroup } from "./types";
import { AppAction } from "./actionTypes";

const initialState: AppState = {
    pages: [],
    currentPage: 'components/inputs/autocompletefield/autocompletefield.html',
    customCss: "",
    customJs: "",
    zoom: 1,
    viewport: "desktop",
    direction: "ltr",
    panelDock: "bottom",
    codeEditorSidebarOpen: false,
    testSidebarOpen: false,
    searchQuery: "",
    loading: true,
    error: null,
    stylingUIState: { scrollPosition: 0, expandedAccordions: [] },
    savedTheme: null,
    componentSchema: null,
    controlsTabValues: {},
    controlsTabDefaultValues: {},
    styleTabValues: {},
    styleTabDefaultValues: {},
    portalTags: [],
    portalTagsEnabled: false,
    previewBackgroundColor: typeof window !== 'undefined' 
        ? (localStorage.getItem('previewBackgroundColor') || '#fff')
        : '#fff',
};

export const appReducer = (
    state = initialState,
    action: AppAction
): AppState => {
    return produce(state, (draft) => {
        switch (action.type) {
            case ActionTypes.SET_PAGES:
                draft.pages = action.payload;
                break;

            case ActionTypes.SET_CURRENT_PAGE:
                draft.currentPage = action.payload;
                // Clear scrolling position and expanded accordions state when switching to a different component
                draft.stylingUIState = {
                    scrollPosition: 0,
                    expandedAccordions: []
                };
                break;

            case ActionTypes.SET_COMPONENT_SCHEMA: {
                draft.componentSchema = action.payload;
                draft.controlsTabValues = {},
                draft.controlsTabDefaultValues = {},
                draft.styleTabValues = {},
                draft.styleTabDefaultValues = {};

                for (const field of action.payload?.controls || []) {
                    if (field.defaultValue !== undefined) {
                        draft.controlsTabValues[field.id] = field.defaultValue;
                        draft.controlsTabDefaultValues[field.id] = field.defaultValue;
                    }
                }

                const collectStyleTabValues = (items?: (StyleField | StyleGroup)[]) => {

                    if (!items || items.length === 0) return;

                    items.forEach((item) => {
                        const field = item as StyleField;

                        if ("id" in item && field.cssVariable ) {
                            const fieldValue = draft.savedTheme?.[field.cssVariable] ?? field.defaultValue;

                            if (fieldValue !== undefined) {
                                draft.styleTabDefaultValues[field.id] = fieldValue;
                                draft.styleTabValues[field.cssVariable] = {
                                    id: field.id,
                                    value: fieldValue,
                                    themeKey: field?.themeKey,
                                    isEnabled: Boolean(draft.savedTheme?.[field.cssVariable] !== undefined) || false
                                };
                                draft.styleTabDefaultValues[`${field.id}_enabled`] = draft.styleTabValues[field.cssVariable].isEnabled;
                            }
                        }

                        if ("fields" in item && item.fields) {
                            collectStyleTabValues(item.fields);
                        }
                    });
                };

                collectStyleTabValues(draft.componentSchema?.styles);

                break;
            }

            case ActionTypes.UPDATE_CONTROLS_TAB_VALUES: {
                Object.keys(action.payload).forEach((key) => {
                    draft.controlsTabValues[key] = action.payload[key];
                });
                break;
            }

            case ActionTypes.UPDATE_STYLE_TAB_VALUES: {
                Object.keys(action.payload).forEach((key) => {
                    // draft.styleTabDefaultValues[key] = action.payload[key].value;
                    draft.styleTabValues[key] = {
                        ...draft.styleTabValues[key],
                        ...action.payload[key]
                    };
                    // draft.styleTabDefaultValues[`${action.payload[key].id}_enabled`] = action.payload[key].isEnabled;
                });
                break;
            }

            case ActionTypes.UPDATE_STYLE_TAB_VALUES_WITH_DEFAULT: {
                draft.styleTabDefaultValues = {
                    ...draft.styleTabDefaultValues
                };
                Object.keys(action.payload).forEach((key) => {
                    draft.styleTabDefaultValues[action.payload[key].id] = action.payload[key].value;
                    draft.styleTabValues[key] = {
                        ...draft.styleTabValues[key],
                        ...action.payload[key]
                    };
                    draft.styleTabDefaultValues[`${action.payload[key].id}_enabled`] = action.payload[key].isEnabled;
                });
                break;
            }

            case ActionTypes.UPDATE_STYLE_TAB_DEFAULT_VALUES: {
                draft.styleTabDefaultValues = {};

                Object.keys(draft.styleTabValues).forEach((key) => {
                    draft.styleTabDefaultValues[draft.styleTabValues[key].id] = draft.styleTabValues[key].value;
                    draft.styleTabDefaultValues[`${draft.styleTabValues[key].id}_enabled`] =draft.styleTabValues[key].isEnabled;
                });

                break;
            }

            case ActionTypes.UPDATE_STYLE_TAB_TO_DEFAULT_VALUES: {
                draft.styleTabValues = {},
                draft.styleTabDefaultValues = {};

                const collectStyleTabValues = (items?: (StyleField | StyleGroup)[]) => {

                    if (!items || items.length === 0) return;

                    items.forEach((item) => {
                        const field = item as StyleField;

                        if ("id" in item && field.cssVariable ) {
                            const fieldValue = field.defaultValue;

                            if (fieldValue !== undefined) {
                                draft.styleTabDefaultValues[field.id] = fieldValue;
                                draft.styleTabValues[field.cssVariable] = {
                                    id: field.id,
                                    value: fieldValue,
                                    themeKey: field?.themeKey,
                                    isEnabled: false
                                };
                                draft.styleTabDefaultValues[`${field.id}_enabled`] = false;
                            }
                        }

                        if ("fields" in item && item.fields) {
                            collectStyleTabValues(item.fields);
                        }
                    });
                };

                collectStyleTabValues(draft.componentSchema?.styles);

                break;
            }

            case ActionTypes.UPDATE_STYLE_TAB_TO_PREVIOUS_VALUES: {
                if (!draft.savedTheme) return;
                
                draft.styleTabValues = {},
                draft.styleTabDefaultValues = {};

                const collectStyleTabValues = (items?: (StyleField | StyleGroup)[]) => {

                    if (!items || items.length === 0) return;

                    items.forEach((item) => {
                        const field = item as StyleField;

                        if ("id" in item && field.cssVariable ) {
                            const fieldValue = draft.savedTheme?.[field.cssVariable];

                            if (fieldValue !== undefined) {
                                draft.styleTabDefaultValues[field.id] = fieldValue;
                                draft.styleTabValues[field.cssVariable] = {
                                    id: field.id,
                                    value: fieldValue,
                                    themeKey: field?.themeKey,
                                    isEnabled: Boolean(draft.savedTheme?.[field.cssVariable] !== undefined) || false
                                };
                                draft.styleTabDefaultValues[`${field.id}_enabled`] = draft.styleTabValues[field.cssVariable].isEnabled;
                            }
                        }

                        if ("fields" in item && item.fields) {
                            collectStyleTabValues(item.fields);
                        }
                    });
                };

                collectStyleTabValues(draft.componentSchema?.styles);

                break;
            }

            case ActionTypes.SET_STYLING_TAB_UI_STATE:
                draft.stylingUIState = {
                    ...draft.stylingUIState,
                    ...action.payload
                };
                break;

            case ActionTypes.SET_STYLING_THEME: {
                const themeToSave: TStoredThemeStyles = {};

                for (const key in action.payload) {
                    themeToSave[key] = action.payload[key];
                }

                draft.savedTheme = themeToSave;

                break;

            }
            case ActionTypes.SET_CUSTOM_CSS:
                draft.customCss = action.payload;
                break;

            case ActionTypes.SET_CUSTOM_JS:
                draft.customJs = action.payload;
                break;

            case ActionTypes.SET_ZOOM:
                draft.zoom = action.payload;
                break;
            case ActionTypes.SET_VIEWPORT:
                draft.viewport = action.payload;
                break;
            case ActionTypes.SET_DIRECTION:
                draft.direction = action.payload;
                break;
            case ActionTypes.SET_PANEL_DOCK:
                draft.panelDock = action.payload;
                break;
            case ActionTypes.TOGGLE_CODE_EDITOR_SIDEBAR:
                draft.codeEditorSidebarOpen = !draft.codeEditorSidebarOpen;
                // Close test sidebar when code editor sidebar opens
                if (draft.codeEditorSidebarOpen) {
                    draft.testSidebarOpen = false;
                }
                break;
            case ActionTypes.TOGGLE_TEST_SIDEBAR:
                draft.testSidebarOpen = !draft.testSidebarOpen;
                // Close code editor sidebar when test sidebar opens
                if (draft.testSidebarOpen) {
                    draft.codeEditorSidebarOpen = false;
                }
                break;
            case ActionTypes.SET_SEARCH_QUERY:
                draft.searchQuery = action.payload;
                break;
            case ActionTypes.SET_LOADING:
                draft.loading = action.payload;
                break;
            case ActionTypes.SET_ERROR:
                draft.error = action.payload;
                break;
            case ActionTypes.SET_PORTAL_TAGS:
                draft.portalTags = action.payload;
                break;
            case ActionTypes.SET_PORTAL_TAGS_ENABLED:
                draft.portalTagsEnabled = action.payload;
                break;
            case ActionTypes.SET_PREVIEW_BACKGROUND_COLOR:
                draft.previewBackgroundColor = action.payload;
                // Save to localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('previewBackgroundColor', action.payload);
                }
                break;
        }
    });
};
