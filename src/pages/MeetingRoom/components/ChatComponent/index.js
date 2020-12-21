import React from 'react'
import Icon from '../../../../constants/icons'
import './style.scss'

function ChatComponent(props) {
  return (
    <div className="chatting__component">
      <div className="chatting-tasks">
        <ul>
          <li><img src={Icon.chatCameraOnIcon}></img></li>
          <li><img src={Icon.chatFileIcon}></img></li>
          <li><img src={Icon.chatTalkOnIcon}></img></li>
        </ul>
      </div>
      <div className="chatting-content"> 
        as
      </div>
    </div>
  )
}

export default ChatComponent

