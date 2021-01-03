import { createSelector } from "reselect";

const selectRaw = (state) => state.chat;


const selectCurrentChattingState = createSelector(
    [selectRaw],
    (chat) => chat.chattingState
);


const selectDisableAllChat = createSelector(
    [selectRaw],
    (chat) => chat.disableAllChat
)
const selectors = {
    selectCurrentChattingState,
    selectDisableAllChat
};

export default selectors;
