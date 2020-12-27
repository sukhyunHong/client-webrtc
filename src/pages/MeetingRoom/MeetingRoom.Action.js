import constants from "./MeetingRoom.Constants"
import getStore, { getHistory } from "../../store/config";
import Errors from "../../components/Error/error";
import services from "./MeetingRoom.Service";
import { emitSentMessage, emitCreateGroup } from "./MeetingRoom.Socket";
import getSocket from "../rootSocket";
import meetingRoomSocket from './MeetingRoom.Socket'

const actions = {
  // doToggleScrollToBottom: () => ({
  //   type: constants.CHAT_SCROLL_TO_BOTTOM_TOGGLE,
  // }),
  // doClear: () => ({
  //   type: constants.CHAT_CLEAR_DATA
  // }),
  // // Lấy danh sách những cuộc trò chuyện
  // list: (data) => async (dispatch) => {
  //   try {
  //     dispatch({ type: constants.CHAT_GET_START });
  //     let gskip = data && data.gskip ? data.gskip : 0
  //     let pskip = data && data.pskip ? data.pskip : 0;
  //     let response = await services.getListFn({ gskip, pskip });

  //     dispatch({
  //       type: constants.CHAT_GET_SUCCESS,
  //       payload: {
  //         messages: response.data,
  //         skip: gskip + pskip,
  //       },
  //     });
  //   } catch (error) {
  //     Errors.handle(error);
  //     dispatch({
  //       type: constants.CHAT_GET_ERROR,
  //     });
  //     getHistory().push("/");
  //   }
  // },

  // //Send 
  // doCreate: (info) => async (dispatch) => {
  //   try {
  //     dispatch({
  //       type: constants.CHAT_CREATE_START,
  //     });

  //     const response = await services.createFn(info);

  //     emitSentMessage(response.data);

  //     let state = getStore().getState();
  //     let currentUser = state.user.current;
  //     dispatch({
  //       type: constants.CHAT_CREATE_SUCCESS,
  //       payload: { message: response.data, currentUser },
  //     });
  //   } catch (error) {
  //     Errors.handle(error);
  //     dispatch({
  //       type: constants.CHAT_CREATE_ERROR,
  //     });
  //   }
  // },
  setHostUser: (data) => (dispatch) => {
    try {
      dispatch({
        type: constants.SET_HOST,
        payload: {listUser : data}
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
