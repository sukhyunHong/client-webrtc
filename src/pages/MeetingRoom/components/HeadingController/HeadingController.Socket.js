
import getSocket from "../rootSocket"
import getStore from "../../store/config"

const headingControllerSSocket = {
  sendToPeer : (messageType, payload, socketID) => {
    getSocket().emit(messageType, {
      socketID,
      payload
    })
  }
} 

export default headingControllerSSocket