import { createSelector } from "reselect";

const selectRaw = (state) => state.room;

const getLocalStream = createSelector(
    [selectRaw],
    (room) => room.localStream
);

const selectors = {
  getLocalStream,
};

export default selectors;

