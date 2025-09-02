import { createStore, combineReducers } from "redux";
import { appReducer } from "./reducer";

const rootReducer = combineReducers({
    app: appReducer,
});

export const store = createStore(rootReducer);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
