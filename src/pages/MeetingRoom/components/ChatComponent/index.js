import React, { useEffect, useState } from 'react'
import Icon from '../../../../constants/icons'
import './style.scss'
import './style2.scss'
import moment from "moment"
import qs from "query-string"
import chatComponentSocket from './ChatComponent.Socket'
import chatComponentService from './ChatComponent.Service'
import getSocket from '../../../rootSocket'

import roomSelector from '../../MeetingRoom.Selector'
import { useSelector } from 'react-redux'

moment.locale()
function ChatComponent(props) {


  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [user, setUser] = useState({ uid: 0 })
  const [boxedListUser, setBoxedListUser] = useState(false)
  const [listUser, setListUser] = useState([])
  
  const isHostUser = useSelector(roomSelector.selectIsHostUser)


   //!나중에 추가함
  const [imageZoom, setImageZoom] = useState(false)
  const [selectedImage, setSelectedImage] = useState("")


  const scrollToBottom = () => {
    const chat = document.getElementById("chatList")
    chat.scrollTop = chat.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
    // setUser({ uid: props.user.uid })

    // const textRequest = props.messages.filter(
    //   message => message.type === "text-request"
    // )
    // if (textRequest.length !== 0) {
    //   // sendMessage(textRequest[0])
    // }
    let roomname = qs.parse(window.location.search).room
    let username = qs.parse(window.location.search).user
    // Axios({
    //   method: "get",
    //   url: `${process.env.REACT_APP_SERVER_API}/room/getlistuserbyroom`,
    //   params: {
    //     roomname,
    //     username
    //   }
    // }).then(res => {
    //   const { data } = res
    //   const hostStream = data.data[0]
    //   const listUser = data.data.slice(1, data.data.length)
    //   setListUser(listUser)
    // })
  }, [props])
  
  useEffect(() => {

    console.log("is Host user", isHostUser)

    //요청하고 있는거 알려줌
    getSocket().on("alert-all-request-message", data => {

        const {id, type, timestamp, user_idx, username } = data
        let message = {
          type: "request",
          message: {
            id: id,
            sender: {
              uid: user_idx, 
              username: username
            },
            data: {
              text: type,
              time: timestamp
            }
          }
        }
        setMessages(prevState => [...prevState, message])
    })


    getSocket().on("res-sent-message", data => {
        setMessages(prevState => [...prevState, data])  
    })
    getSocket().on("res-sent-files", data => {
      const { senderId, senderName, fileHash, originalname, size, mimetype } = data
      let message = {
        type: "file",
        message: {
          id: data,
          sender: {
            uid: senderId, 
            username: senderName
          },
          data: {
            text: originalname,
            size: size,
            fileHash: fileHash,
            mimetype
          }
        }
      }
      setMessages(prevState => [...prevState, message])
    })
  },[])

  const sendMessage = msg => {
    props.sendMessage(msg)
    scrollToBottom()
  }

  const getToken = () => {
    const { userInfoToken } = JSON.parse(window.localStorage.getItem("asauth"))
    return userInfoToken
  }
  const userRoomId = () => {
    return JSON.parse(window.localStorage.getItem("usr_id"))
  }
  const handleSubmit = event => {
    if (message === "") return
    event.preventDefault()

    let payload = {
      type: "text",
      message: {
        sender: { uid: getToken().userId },
        data: { text: message }
      }
    }
    chatComponentSocket.emitSentMessage(payload)
    setMessage("")
  }

  const renderMessage = (userType, data) => {
    const message = data.message
    const { type } = data
    let msgDiv
    if (type === "text") {
      msgDiv = (
        <div className="msg-type">
          <div className="msg-type__info">
            <span className="msg-type__name">{message.sender.username}</span>
            <span className="msg-type__time">{moment(message.data.timestamp).format("LT")}</span>
          </div>
          <div className="msg-type__message"> {message.data.text}</div>
        </div>
      )
    } else if (type === "request") {
      console.log(isHostUser)
      console.log(data)
      //강사인 경우에는
      if (isHostUser) {
        const { message } = data;
        // const requestType = message.data.text === "질문 요청" ? "question" : "lecOut"
        const messageInfo = message.data.text === "request_question" ? `${message.sender.username} 학생이 질문을 요청하였습니다.` : `${message.sender.username}학생이 자리비움을 요청하였습니다.`
        msgDiv = (
          <div className="msg-request">
            <div className="msg-request__heading">
              <p>{messageInfo}</p>
              <span>{moment(message.data.time).format("LT")}</span>
            </div>
            <div className="msg-request__button mobile">
              <button
                // onClick={() =>
                //   handleActionRequestUser(
                //     message.id,
                //     "accept",
                //     requestType
                //   )
                // }
              >
                수락
              </button>
              <button
                // onClick={() =>
                //   handleActionRequestUser(
                //     message.id,
                //     "reject",
                //     requestType
                //   )
                // }
              >
                취소
              </button>
            </div>
          </div>
        )
      } else {
        const messageInfo = message.data.text === "request_question" ? `${message.sender.username}학생이 질문을 요청중입니다...` : `${message.sender.username}학생이 자리비움을 요청중입니다.`
        msgDiv = (
          <div className="msg-request">
            <div className="msg-request__heading">
              {messageInfo}
              <span>{moment(message.data.time).format("LT")}</span>
            </div>
          </div>
        )
      }
    } else if (type === "file") {
      const { data } = message
      msgDiv = (
        <div className="file-type">
          <div className="file-type__info">
            <span className="file-type__name">{message.sender.username}</span>
            <span className="file-type__time">{moment().format("LT")}</span>
          </div>
          <div className="file-type__message">
            <p>{message.data.text}</p>
            {/* <p>요효기간 ~ <span>2020.09.30</span></p> */}
            <p className="file-type__size">
              용량 : <span>{(data.size / 1000).toFixed(2)} KB</span>
            </p>
            <button
              className="file-type__btn"
              onClick={() => handleDownload(data.fileHash)}
            >
              다운로드
            </button>
          </div>
        </div>
      )
    } else if (type === "text-alert") {
      const { data } = message
      const messageInfo = message.sender.username + " " + data.text
      msgDiv = (
        <div className="msg-request">
          <div className="msg-request__heading">
            <p>{messageInfo}</p>
            <span>{moment().format("LT")}</span>
          </div>
        </div>
      )
    } else {
      msgDiv = (
        <div className="msg-row">
          <p>{message.sender.username}</p>
          <img
            onClick={() => {
              setImageZoom(true)
              setSelectedImage(message.data)
            }}
            className="message"
            style={{
              width: 200,
              // height: 100
              cursor: "pointer"
            }}
            alt="update img"
            src={message.data}
          />
        </div>
      )
    }

    return <li className={userType}>{msgDiv}</li>
  }
  const handleValueFile = e => {
    // const { name, size, type } = e.target.files[0];
    let params = {
      userRoomId: userRoomId()
    }
    const { size } = e.target.files[0]
    if ((size / 1000000) < 100) {
      let data = new FormData()
      data.append("file", e.target.files[0])
      data.append("params", JSON.stringify(params))
      chatComponentService.upFile(data)
      
      // (`${process.env.REACT_APP_SERVER_API}/room/upfile`, data, {
      //   headers: {
      //     "Content-Type": "application/json"
      //   }
      // })
    } else {
      alert("파일 공유 용량제한이 100MB이하 입니다.")
    }
  }
  const handleDownload = path => {
    const url = path
    const link = document.createElement("a")
    link.setAttribute("href", `${process.env.REACT_APP_SERVER_API}/${url}`)
    link.setAttribute("download", "") //! 안 됨
    link.setAttribute("target", "_blank")
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClickUpFile = () => {
    const upFile = document.createElement("input")
    upFile.setAttribute("type", "file")
    upFile.setAttribute("name", "file")
    upFile.setAttribute("style", "display: none")
    document.body.appendChild(upFile)
    upFile.click()
    upFile.onchange = handleValueFile
  }

  const handleClickCameraOn = () => {
    const upImage = document.createElement("input")
    upImage.setAttribute("type", "file")
    upImage.setAttribute("name", "file")
    upImage.setAttribute("accept", "image/*")
    upImage.setAttribute("style", "display: none")
    document.body.appendChild(upImage)
    upImage.click()
    upImage.onchange = handleValueFile
  }
  const handleChange = event => {
    setMessage(event.target.value)
  }

  const handleOffChatForUser = (userId) => {

  }
  return (
    <div className="chatting__component">
      <div className="chatting-tasks">
        <ul>
          {
            isHostUser ?
            <>
              <li><img onClick={() => handleClickCameraOn()} src={Icon.chatCameraOnIcon}></img></li>
              <li><img onClick={() => handleClickUpFile()} src={Icon.chatFileIcon}></img></li>
              <li><img  onClick={() => setBoxedListUser(!boxedListUser)} src={Icon.chatTalkOnIcon}></img>
                {
                  boxedListUser &&
                  <div className="list-user-chat">
                    <ul>
                      {listUser.length !== 0 && (
                        <>
                          <li
                            onClick={() => { 
                              handleOffChatForUser(0)
                              setBoxedListUser(!boxedListUser) }}
                          >
                            1. 전체
                          </li>
                          {listUser.map((user, idx) => (
                            <li onClick={() => { 
                                handleOffChatForUser(user.socket_id) 
                                setBoxedListUser(!boxedListUser)
                              }}
                              key={idx}
                            >
                              {idx + 2}.{user.username}
                            </li>
                          ))}
                        </>
                      )}
                    </ul>
                  </div>
                }
              </li>
            </> :
            <>
              <li><img onClick={() => handleClickUpFile()} src={Icon.chatFileIcon}></img></li>
            </>
          }
        </ul>
      </div>
      <div className="chatting-content"> 
        <div className="chatWindow" >
          <ul className="chat" id="chatList">
            {messages.map((data, idx) => (
              <div key={idx}>
                {
                  getToken().userId === data.message.sender.uid
                  ? renderMessage("self", data)
                  : renderMessage("other", data)
                }
              </div>
            ))}
          </ul>
          <div>
            <form onSubmit={handleSubmit}>
              <input
                className="textarea input"
                type="text"
                placeholder={
                  props.normalUserChat ? "채팅 금지 상태입니다 ..." : "채팅 ..."
                }
                onChange={(event) => setMessage(event.target.value)}
                value={message}
                // readOnly={props.normalUserChat}
                // style={props.normalUserChat ? { border: "2px solid red" } : {}}
              />
              {/* <button style={{position: "absolute"}}>전송</button> */}
            </form>
          </div>
          {/* </DragDrop> */}
        </div>
      </div>
    </div>
  )
}
//!나중에 
const MessageComponent = (type, data) => {
  <p></p>
}
export default ChatComponent

