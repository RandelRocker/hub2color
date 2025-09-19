import { produce } from "immer";
import { ActionTypes } from "./constants";
import { AppState, StyleField, StyleGroup } from "./types";
import { AppAction } from "./actionTypes";

const initialState: AppState = {
    pages: [],
    currentPage: null,
    controlsSchema: null,
    styleSchema: null,
    styleSchemaDefaults: {},
    selectedTemplate: null,
    controlValues: {},
    stylingTheme: {},
    stylingUIState: { scrollPosition: 0, expandedAccordions: [] },
    savedTheme: { themeStyles: {}, cssVariableStyles: {} },
    customCss: "",
    customJs: "",
    zoom: 1,
    viewport: "desktop",
    direction: "ltr",
    panelDock: "bottom",
    searchQuery: "",
    loading: false,
    error: null
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
                // Clear styling UI state when switching to a different component
                draft.stylingUIState = {
                    scrollPosition: 0,
                    expandedAccordions: []
                };

                // Restore saved data for this page if it exists
                if (action.payload && draft.savedTheme) {
                    draft.stylingTheme = JSON.parse(
                        JSON.stringify(draft.savedTheme.themeStyles || {})
                    );
                } else {
                    draft.stylingTheme = {};
                }
                break;
            case ActionTypes.SET_CONTROLS_SCHEMA:
                draft.controlsSchema = action.payload;
                draft.selectedTemplate = null;
                if (action.payload) {
                    if (
                        action.payload.templates &&
                        action.payload.templates.length > 0
                    ) {
                        const firstTemplate = action.payload.templates[0];
                        draft.selectedTemplate = firstTemplate;
                        draft.controlValues = {
                            ...firstTemplate.props.defaults
                        };
                    } else if (action.payload.defaults) {
                        draft.controlValues = { ...action.payload.defaults };
                    }
                }
                break;
            case ActionTypes.SET_STYLE_SCHEMA: {
                draft.styleSchema = action.payload;
                draft.styleSchemaDefaults = {};

                const collectDefaults = (
                    items: (StyleField | StyleGroup)[]
                ) => {
                    items.forEach((item) => {
                        if (
                            "id" in item &&
                            item.type !== "group" &&
                            item.type !== "sectionTitle"
                        ) {
                            const field = item as StyleField;
                            if (field.defaultValue !== undefined) {
                                draft.styleSchemaDefaults[field.id] =
                                    field.defaultValue;
                            }

                            if (
                                field.themeKey &&
                                draft.savedTheme?.themeStyles[field.themeKey]
                            ) {
                                const valueFromTheme =
                                    draft.savedTheme.themeStyles[field.themeKey]
                                        .value;

                                if (valueFromTheme !== undefined) {
                                    draft.styleSchemaDefaults[field.id] =
                                        valueFromTheme;
                                    draft.styleSchemaDefaults[
                                        `${field.id}_enabled`
                                    ] =
                                        draft.savedTheme.themeStyles[
                                            field.themeKey
                                        ].isEnabled;
                                }
                            }
                        }
                        if ("fields" in item && item.fields) {
                            collectDefaults(item.fields);
                        }
                    });
                };

                if (action.payload?.style) {
                    collectDefaults(action.payload.style);
                }
                break;
            }
            case ActionTypes.UPDATE_STYLE_SCHEMA_DEFAULTS: {
                draft.styleSchemaDefaults = {};

                const collectDefaultsFromTheme = (
                    items: (StyleField | StyleGroup)[]
                ) => {
                    items.forEach((item) => {
                        if (
                            "id" in item &&
                            item.type !== "group" &&
                            item.type !== "sectionTitle"
                        ) {
                            const field = item as StyleField;

                            // Start with field's default value
                            if (field.defaultValue !== undefined) {
                                draft.styleSchemaDefaults[field.id] =
                                    field.defaultValue;
                            }

                            // Override with current styling theme values if they exist
                            if (
                                field.themeKey &&
                                draft.stylingTheme[field.themeKey]
                            ) {
                                const themeValue = draft.stylingTheme[field.themeKey];

                                if (themeValue.value !== undefined) {
                                    draft.styleSchemaDefaults[field.id] = themeValue.value;
                                    draft.styleSchemaDefaults[`${field.id}_enabled`] = themeValue.isEnabled;
                                }
                            }
                        }
                        if ("fields" in item && item.fields) {
                            collectDefaultsFromTheme(item.fields);
                        }
                    });
                };

                if (draft.styleSchema?.style) {
                    collectDefaultsFromTheme(draft.styleSchema.style);
                }
                break;
            }
            case ActionTypes.SET_SELECTED_TEMPLATE:
                if (action.payload && draft.controlsSchema?.templates) {
                    const selectedTemplate =
                        draft.controlsSchema.templates.find(
                            (t) => t.templateName === action.payload
                        );
                    if (selectedTemplate) {
                        draft.selectedTemplate = selectedTemplate;
                        draft.controlValues = {
                            ...selectedTemplate.props.defaults
                        };
                    }
                }
                break;
            case ActionTypes.SET_CONTROL_VALUE:
                if (!draft.controlValues) {
                    draft.controlValues = {};
                }
                draft.controlValues[action.payload.name] = action.payload.value;
                break;
            case ActionTypes.SET_BULK_CONTROLS:
                draft.controlValues = action.payload;
                break;
            case ActionTypes.UPDATE_STYLING_THEME:
                draft.stylingTheme = {
                    ...draft.stylingTheme,
                    ...action.payload
                };
                break;
            case ActionTypes.SET_STYLING_UI_STATE:
                if (!draft.stylingUIState) {
                    draft.stylingUIState = {
                        scrollPosition: 0,
                        expandedAccordions: []
                    };
                }
                draft.stylingUIState = {
                    ...draft.stylingUIState,
                    ...action.payload
                };
                break;
            case ActionTypes.SET_SAVED_THEME:
                draft.savedTheme = action.payload;
                break;
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
            case ActionTypes.SET_SEARCH_QUERY:
                draft.searchQuery = action.payload;
                break;
            case ActionTypes.SET_LOADING:
                draft.loading = action.payload;
                break;
            case ActionTypes.SET_ERROR:
                draft.error = action.payload;
                break;
        }
    });
};
