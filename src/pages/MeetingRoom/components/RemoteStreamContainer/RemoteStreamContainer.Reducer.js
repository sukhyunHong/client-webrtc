import produce from 'immer'
import constants from './RemoteStreamContainer.Constants'

const initialState = {
  listUser: [],
  lectureInfo: null
}

export const remoteReducer =(state = initialState, { type, payload })  =>
  produce(state, draft => {
    switch (type) {
      case constants.SET_LIST_USER:
        draft.listUser = payload.listUser
        break;
      case constants.SET_LECTURE_INFO:
        draft.lectureInfo = payload.lecture
        break;
      default:
        return state
    }
  })
export default remoteReducer;

