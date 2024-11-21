import keplerGlReducer from "kepler.gl/reducers";
import {createStore, combineReducers, applyMiddleware} from "redux";
import {taskMiddleware} from "react-palm/tasks";

const reducers = combineReducers({
    keplerGl: keplerGlReducer,
});

const store = createStore(reducers, {}, applyMiddleware(taskMiddleware));
export default store;