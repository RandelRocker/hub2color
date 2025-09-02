import { createStore, combineReducers } from "redux";
import { appReducer } from "./reducer";
const rootReducer = combineReducers({
  app: appReducer,
});
export const store = createStore(rootReducer);
