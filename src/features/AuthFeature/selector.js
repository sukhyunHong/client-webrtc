import { createSelector } from "reselect";

const selectRaw = state => state.auth;

// select loading
const selectInitLoading = createSelector(
    [selectRaw],
    auth => auth.initLoading
);

const selectSigninLoading = createSelector(
    [selectRaw],
    auth => auth.signinLoading
);

// select errors
const selectSigninError = createSelector([selectRaw], 
    auth => auth.signinError
);

const selectors = {
    selectInitLoading,
    selectSigninLoading,
    selectSigninError,
};

export default selectors;
