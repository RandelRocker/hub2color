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
    stylingValues: {},
    stylingTheme: {},
    customCss: "",
    customJs: "",
    zoom: 1,
    viewport: "desktop",
    direction: "ltr",
    panelDock: "bottom",
    searchQuery: "",
    loading: false,
    error: null,
};

export const appReducer = (
    state = initialState,
    action: AppAction,
): AppState => {
    return produce(state, (draft) => {
        switch (action.type) {
            case ActionTypes.SET_PAGES:
                draft.pages = action.payload;
                break;
            case ActionTypes.SET_CURRENT_PAGE:
                draft.currentPage = action.payload;
                break;
            case ActionTypes.SET_CONTROLS_SCHEMA:
                draft.controlsSchema = action.payload;
                draft.selectedTemplate = null;
                if (action.payload) {
                    if (action.payload.templates && action.payload.templates.length > 0) {
                        const firstTemplate = action.payload.templates[0];
                        draft.selectedTemplate = firstTemplate;
                        draft.controlValues = { ...firstTemplate.props.defaults };
                    } else if (action.payload.defaults) {
                        draft.controlValues = { ...action.payload.defaults };
                    }
                }
                break;
            case ActionTypes.SET_STYLE_SCHEMA: {
                draft.styleSchema = action.payload;
                
                const collectDefaults = (items: (StyleField | StyleGroup)[]) => {
                    items.forEach((item) => {
                        if (
                            "id" in item &&
                            item.type !== "group" &&
                            item.type !== "sectionTitle"
                        ) {
                            const field = item as StyleField;
                            if (field.defaultValue !== undefined) {
                                draft.styleSchemaDefaults[field.id] = field.defaultValue;
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
            case ActionTypes.SET_SELECTED_TEMPLATE:
                if (action.payload && draft.controlsSchema?.templates) {
                    const selectedTemplate = draft.controlsSchema.templates.find(
                        t => t.templateName === action.payload
                    );
                    if (selectedTemplate) {
                        draft.selectedTemplate = selectedTemplate;
                        draft.controlValues = { ...selectedTemplate.props.defaults };
                    }
                }
                break;
            case ActionTypes.SET_CONTROL_VALUE:
                draft.controlValues[action.payload.name] = action.payload.value;
                break;
            case ActionTypes.SET_BULK_CONTROLS:
                draft.controlValues = action.payload;
                break;
            case ActionTypes.SET_STYLING_VALUE:
                draft.stylingValues[action.payload.name] = action.payload.value;
                break;
            case ActionTypes.SET_STYLING_THEME:
                draft.stylingTheme = action.payload;
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
