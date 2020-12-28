import { createSelector } from "reselect";

const selectRaw = (state) => state.remoteStream;

const getListUser = createSelector(
    [selectRaw],
    (remoteStream) => remoteStream.listUser
);

const getLectureInfo = createSelector(
  [selectRaw],
  (remoteStream) => remoteStream.lectureInfo
);
const selectors = {
  getListUser,
  getLectureInfo
};

export default selectors;

