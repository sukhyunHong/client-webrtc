import produce from 'immer'
import constants from './MeetingRoom.Constants'

const initialState = {
  localStream: null
}

export const roomReducer =(state = initialState, { type, payload })  =>
  produce(state, draft => {
    switch (type) {
      case constants.CREATE_LOCALSTREAM:
        draft.localStream = payload.localStream
        break;
      default:
        return state
    }
  })
export default roomReducer;

