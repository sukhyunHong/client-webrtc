import produce from 'immer'
import constants from './HeadingController.Constants'

//default true
const initialState = {
  soundState: true,
  micState: true,
  camState: true,
}

export const localStreamReducer =(state = initialState, { type, payload })  =>
  produce(state, draft => {
    switch (type) {
      case constants.CHANGE_SOUND_STATE:
        draft.soundState = !state.soundState;
        console.log(draft.soundState)
        break;
      case constants.CHANGE_SOUND_STATE_ERROR:
        draft.soundState = null
        break;
      case constants.CHANGE_MIC_STATE:
        draft.micState = !draft.micState
        break;
      case constants.CHANGE_MIC_STATE_ERROR:
        draft.micState = null
        break;
      case constants.CHANGE_CAM_STATE:
        draft.camState = !draft.camState
        break;
      case constants.CHANGE_CAM_STATE_ERROR:
        draft.camState = null
        break;
      default:
        return state
    }
  })
export default localStreamReducer;

