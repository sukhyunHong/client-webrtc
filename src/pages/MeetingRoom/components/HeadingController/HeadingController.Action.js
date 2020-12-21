import constants from "./HeadingController.Constants"
// import getStore, { getHistory } from "../../store/config";
import Errors from "../../../../components/Error/error";
// import services from "./MeetingRoom.Service";
// import { emitSentMessage, emitCreateGroup } from "./MeetingRoom.Socket";
// import getSocket from "../rootSocket";
// import meetingRoomSocket from './MeetingRoom.Socket'

const actions = {
  handleChangeSoundState :  () => async(dispatch) => {
    try {
      dispatch({
          type: constants.CHANGE_SOUND_STATE,
      });
    } catch (error) {
        Errors.handle(error);
        dispatch({
            type: constants.CHANGE_SOUND_STATE_ERROR,
        });
    }
  },
  handleChangeMicState :  () => async(dispatch) => {
    try {
      dispatch({
          type: constants.CHANGE_MIC_STATE,
      });
    } catch (error) {
        Errors.handle(error);
        dispatch({
            type: constants.CHANGE_MIC_STATE_ERROR,
        });
    }
  },
  handleChangeCamState :  () => async(dispatch) => {
    try {
      dispatch({
          type: constants.CHANGE_CAM_STATE,
      });
    } catch (error) {
        Errors.handle(error);
        dispatch({
            type: constants.CHANGE_CAM_STATE_ERROR,
        });
    }
  },

};
export default actions;
