import * as constants from "./constants";
import { getHistory } from "../../store/config";
import {
  fetchSignin,
  fetJoinRoom
} from "./service";
import Errors from "../../components/Error/error";
import { socketDisconnect, configSocket } from "../../pages/rootSocket";

const actions = {
  doInitLoadingDone: () => {
    return { type: constants.SIGNIN_INIT_LOADING_DONE };
  },
  doClearErrorMessage: () => {
    return { type: constants.ERROR_MESSAGE_CLEAR };
  },

  doSignout: () => (dispatch) => {
    window.localStorage.removeItem("asauth");
    socketDisconnect();

    getHistory().push("/signin");
    dispatch({ type: "RESET" });
  },
  //! MY fuction
  //해당하는 강좌를 참여하기
  //!꼭 Redux에서 저장할 필요하는가?
  createRoom: (params) => async(dispatch) => {
    try {
      console.log("create Room")

      dispatch({ type: constants.JOINROOM_START });
      let response = await fetJoinRoom(params)

      const { data, result } = response;
      if(result)
      {
        dispatch({
          type: constants.JOINROOM_SUCCESS,
          payload: data
        })

        const { room, usr_id } = data
        window.localStorage.setItem(
          "usr_id",
          JSON.stringify(usr_id)
        );
        getHistory().push(`/meetting/open?room=${room.room_name}&user=${room.user_idx}`);
        configSocket();
      }else{
        alert("해당하는 강죄는 없습니다")
      }
    } catch (error) {
      console.log(error)
      dispatch({
        type: constants.JOINROOM_ERROR,
        payload: Errors.selectMessage(error),
      });
    }
  },

  //create room
  doSignin: (userInfo) => async (dispatch) => {
    try {
      console.log("sign ")
      dispatch({ type: constants.SIGNIN_START });

      // call api: signin
      let response = await fetchSignin(userInfo);

      console.log(response)
      const { result } = response;
      if(result) {
        window.localStorage.setItem(
          "asauth",
          JSON.stringify(response.data)
        );
        dispatch({
          type: constants.SIGNIN_SUCCESS,
          payload: response.data,
        });
        // configSocket();
        // const { roomInfo } = response.a;
        // getHistory().push(`/meetting/open?room=${roomInfo.roomname}&user=${roomInfo.user_id}`);
      }else{
        window.localStorage.removeItem("asauth");
        getHistory().push('/401')
        dispatch({
          type: constants.SIGNIN_ERROR,
          payload: Errors.selectMessage(401),
        });
      }
    } catch (error) {
      console.log(error)
      dispatch({
        type: constants.SIGNIN_ERROR,
        payload: Errors.selectMessage(error),
      });
    }
  },
};
export default actions;
