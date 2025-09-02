import { ActionTypes } from "./constants";
export const setPages = (pages) => ({
  type: ActionTypes.SET_PAGES,
  payload: pages,
});
export const setCurrentPage = (page) => ({
  type: ActionTypes.SET_CURRENT_PAGE,
  payload: page,
});
export const setControlsSchema = (schema) => ({
  type: ActionTypes.SET_CONTROLS_SCHEMA,
  payload: schema,
});
export const setControlValue = (name, value) => ({
  type: ActionTypes.SET_CONTROL_VALUE,
  payload: { name, value },
});
export const setBulkControls = (values) => ({
  type: ActionTypes.SET_BULK_CONTROLS,
  payload: values,
});
export const setStylingValue = (name, value) => ({
  type: ActionTypes.SET_STYLING_VALUE,
  payload: { name, value },
});
export const setCustomCss = (css) => ({
  type: ActionTypes.SET_CUSTOM_CSS,
  payload: css,
});
export const setCustomJs = (js) => ({
  type: ActionTypes.SET_CUSTOM_JS,
  payload: js,
});
export const setZoom = (zoom) => ({
  type: ActionTypes.SET_ZOOM,
  payload: zoom,
});
export const setViewport = (viewport) => ({
  type: ActionTypes.SET_VIEWPORT,
  payload: viewport,
});
export const setDirection = (direction) => ({
  type: ActionTypes.SET_DIRECTION,
  payload: direction,
});
export const setPanelDock = (dock) => ({
  type: ActionTypes.SET_PANEL_DOCK,
  payload: dock,
});
export const setSearchQuery = (query) => ({
  type: ActionTypes.SET_SEARCH_QUERY,
  payload: query,
});
export const setLoading = (loading) => ({
  type: ActionTypes.SET_LOADING,
  payload: loading,
});
export const setError = (error) => ({
  type: ActionTypes.SET_ERROR,
  payload: error,
});
