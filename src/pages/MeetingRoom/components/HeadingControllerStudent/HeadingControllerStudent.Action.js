import constants from "./HeadingControllerStudent.Constants"
// import getStore, { getHistory } from "../../store/config";
import Errors from "../../../../components/Error/error";
import services from "./HeadingControllerStudent.Service";
// import { emitSentMessage, emitCreateGroup } from "./MeetingRoom.Socket";
// import getSocket from "../rootSocket";
// import meetingRoomSocket from './MeetingRoom.Socket'

const actions = {
  //!일단 디비에서 저장함 
  //!redux에서 꼭 저장할 필요한지 고민
  // userRequestQuestion :  (params) => async(dispatch) => {
  //   try {
  //     // dispatch({
  //     //     type: constants.CHANGE_SOUND_STATE,
  //     // });
  //     services.userRequestQuestion(params)
  //   } catch (error) { 
  //       Errors.handle(error);
  //       dispatch({
  //           type: constants.CHANGE_SOUND_STATE_ERROR,
  //       });
  //   }
  // },
  // userRequestLecOut :  (params) => async(dispatch) => {
  //   try {
  //     // dispatch({
  //     //     type: constants.CHANGE_MIC_STATE,
  //     // });
  //     services.userRequestLecOut(params)
  //   } catch (error) {
  //       Errors.handle(error);
  //       dispatch({
  //           type: constants.CHANGE_MIC_STATE_ERROR,
  //       });
  //   }
  // },
};
export default actions;
