import getSocket from "../rootSocket"
import getStore from "../../store/config"
import constans from './MeetingRoom.Constants'

const meetingRoomSocket = {
  sendToPeer : (messageType, payload, socketID) => {
    getSocket().emit(messageType, {
      socketID,
      payload
    })
  }
  
} 

export default meetingRoomSocket