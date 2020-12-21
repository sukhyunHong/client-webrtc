import * as constants from "./constants"
import produce from "immer"
const initialState = {
  initLoading: true,
  dataLoading: false,
  findLoading: false,
  saveLoading: false,
  destroyLoading: false,
  exportLoading: false,
  error: null,
  record: null,
  users: [],
  current: null
}

const userReducer = (state = initialState, { type, payload }) =>
  produce(state, draft => {
    switch (type) {
      // case constants.USER_UPDATE_START:
      //   draft.saveLoading = true
      //   draft.error = null
      //   break
      // case constants.USER_UPDATE_SUCCESS:
      //   draft.saveLoading = false
      //   if (payload) {
      //     draft.current = payload
      //   }
      //   break
      // case constants.USER_UPDATE_ERROR:
      //   draft.saveLoading = false
      //   draft.error = payload
      //   break
      case constants.USER_GET_START:
        draft.findLoading = true
        draft.error = null
        break
      case constants.USER_GET_SUCCESS:
        draft.findLoading = false
        draft.users = payload
        draft.error = null
        break
      case constants.USER_GET_ERROR:
        draft.findLoading = false
        draft.error = payload
        break
      case constants.USER_FIND_START:
        draft.findLoading = true
        draft.error = null
        break
      case constants.USER_FIND_SUCCESS:
        draft.findLoading = false
        draft.record = payload
        draft.error = null
        break
      case constants.USER_FIND_ERROR:
        draft.findLoading = false
        draft.error = payload
        break
      case constants.USER_GET_CURRENT_SUCCESS:
        draft.current = payload
        break
      default:
        break
    }
  })

export default userReducer
