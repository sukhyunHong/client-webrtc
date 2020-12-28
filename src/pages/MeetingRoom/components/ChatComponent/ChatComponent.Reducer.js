import constants from "./ChatComponent.Constants";
import produce from "immer";


const initialState = {
  chattingState: false
};

const chatReducer = (state = initialState, { type, payload }) =>
  produce(state, (draft) => {
    switch (type) {
      case constants.CHAT_STATE_CHANGE:
        draft.chattingState = payload.state
        break;
      default:
        break;
    }
  });

export default chatReducer;
