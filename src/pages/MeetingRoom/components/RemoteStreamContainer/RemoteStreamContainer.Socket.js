import getSocket from "../../../rootSocket"

const remoteStreamContainerSocket = {
  sendToPeer : (messageType, payload, socketID) => {
    getSocket().emit(messageType, {
      socketID,
      payload
    })
  },
  emitHostWarning : (payload) => {
    console.log(payload)
    getSocket().emit("host-send-warning", payload)
  },
  emitHostDisableChat : (payload) => {
    getSocket().emit("host-send-disable-chat", payload)
  },
  emitProcessRequestUser: (payload) => {
    console.log("oneee")
    getSocket().emit("host-send-process-request", payload)
  }
} 

export default remoteStreamContainerSocket