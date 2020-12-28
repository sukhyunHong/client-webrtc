import * as constants from "./constants"
import Message from "../../components/Message"
import Errors from "../../components/Error/error"
import services from "./service"

const messageUpdateSuccess = "Update successfully"
// const messageCreateSuccess = "Create successfully";
// const messageDeleteSuccess = "Delete successfully";

const actions = {

  list: (filter = {}) => async dispatch => {
    try {
      dispatch({ type: constants.USER_GET_START })

      let response = await services.listFn(filter)

      dispatch({
        type: constants.USER_GET_SUCCESS,
        payload: response.data
      })
    } catch (error) {
      Errors.handle(error)
      dispatch({
        type: constants.USER_GET_ERROR
      })
    }
  },

  doFind: id => async dispatch => {
    try {
      dispatch({
        type: constants.USER_FIND_START
      })

      const response = await services.findFn(id)
      dispatch({
        type: constants.USER_FIND_SUCCESS,
        payload: response.data
      })
    } catch (error) {
      Errors.handle(error)
      dispatch({
        type: constants.USER_FIND_ERROR
      })
    }
  },

  getCurrent: () => async dispatch => {
    try {
      dispatch({
        type: constants.USER_GET_CURRENT_START
      })
      let response = await services.getCurrent()
      dispatch({
        type: constants.USER_GET_CURRENT_SUCCESS,
        payload: response.data
      })
    } catch (error) {
      Errors.handle(error)

      dispatch({
        type: constants.USER_GET_CURRENT_ERROR
      })
    }
  },

  // doUpdate: userInfo => async dispatch => {
  //   try {
  //     dispatch({
  //       type: constants.USER_UPDATE_START
  //     })

  //     const response = await services.updateFn(userInfo)

  //     dispatch({
  //       type: constants.USER_UPDATE_SUCCESS,
  //       payload: response.data
  //     })

  //     // Message.success(messageUpdateSuccess);

  //     // getHistory().push("/constants.USER");
  //   } catch (error) {
  //     Errors.handle(error)

  //     dispatch({
  //       type: constants.USER_UPDATE_ERROR
  //     })
  //   }
  // },

  // doUpdatePassword: userInfo => async dispatch => {
  //   try {
  //     dispatch({
  //       type: constants.USER_UPDATE_START
  //     })

  //     await services.updatePasswordFn(userInfo)

  //     dispatch({
  //       type: constants.USER_UPDATE_SUCCESS
  //     })

  //     Message.success(messageUpdateSuccess)

  //     // getHistory().push("/constants.USER");
  //   } catch (error) {
  //     Errors.handle(error)

  //     dispatch({
  //       type: constants.USER_UPDATE_ERROR
  //     })
  //   }
  // }
}
export default actions
