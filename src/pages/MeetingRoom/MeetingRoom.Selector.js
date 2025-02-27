import { createSelector } from "reselect";

const selectRaw = (state) => state.room;

const getLocalStream = createSelector(
    [selectRaw],
    (room) => room.localStream
);
const selectIsHostUser = createSelector(
    [selectRaw],
    (room) => room.isHostUser
)

const selectors = {
  getLocalStream,
  selectIsHostUser
};

export default selectors;