import constants from "./MeetingRoom.Constants"
import getStore, { getHistory } from "../../store/config";
import Errors from "../../components/Error/error";
import services from "./MeetingRoom.Service";
import { emitSentMessage, emitCreateGroup } from "./MeetingRoom.Socket";
import getSocket from "../rootSocket";
import meetingRoomSocket from './MeetingRoom.Socket'

const actions = {
  setHostUser: (data) => (dispatch) => {
    try {
      dispatch({
        type: constants.SET_HOST,
        payload: data
      })
    } catch (error) {
      Errors.handle(error);
    }
  },
  doCreateLocalStream :  (localStream) => async(dispatch) => {
    try {
        dispatch({
            type: constants.CREATE_LOCALSTREAM,
            payload: { localStream: localStream },
        });
    } catch (error) {
        Errors.handle(error);
        dispatch({
            type: constants.CREATE_LOCALSTREAM_ERROR,
        });
    }
  },
  whoisOnline: () => async(dispatch) => {
    try {
        // dispatch({type: constants.WHO_IS_ONLINE_START})
        meetingRoomSocket.sendToPeer("onlinePeers", null, { local: getSocket().id});
    } catch (error) {
      console.log(error)
    }
  }
  
};
export default actions;
