import getSocket from "../rootSocket"
import getStore from "../../store/config"
import constants from './MeetingRoom.Constants'

const chatService = {
  emitSentMessage: (payload) => {
    getSocket().emit("sent-message", payload);
  },
  onSentMessage: (payload) => {
    let state = getStore().getState();
    let currentUser = state.user.current;
    getStore().dispatch({
      type: constants.SOCKET_SENT_MESSAGE,
      payload: { message: payload, currentUser: currentUser }
    })
  },
}

export default chatService