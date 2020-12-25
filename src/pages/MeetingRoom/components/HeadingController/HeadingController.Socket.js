
import getSocket from "../../../rootSocket"
import getStore from "../../../../store/config"

const headingControllerSSocket = {
  sendToPeer : (messageType, payload, socketID) => {
    getSocket().emit(messageType, {
      socketID,
      payload
    })
  },
  emitUserRequestQuestion : (payload) => {
    getSocket().emit("user-request-question", payload)
  },
  emitUserRequestLecOut: (payload) => {
    getSocket().emit("user-request-lecOut", payload)
  }
} 

export default headingControllerSSocket