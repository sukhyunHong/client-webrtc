import getSocket from "../../../rootSocket"

const ChatComponentSocket = {
  emitSentMessage :  (payload) => {
    getSocket().emit("sent-message", payload);
  }
} 
export default ChatComponentSocket;
