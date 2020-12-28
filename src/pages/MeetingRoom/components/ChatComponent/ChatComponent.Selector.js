import { createSelector } from "reselect";

const selectRaw = (state) => state.chat;


const selectCurrentChattingState = createSelector(
    [selectRaw],
    (chat) => chat.chattingState
);

const selectors = {
    selectCurrentChattingState
};

export default selectors;
