// https://www.freecodecamp.org/news/building-a-modern-chat-application-with-react-js-558896622194/
import React, { useState, useEffect } from 'react'
import './style.scss'
import moment from 'moment'
import Axios from 'axios';
import qs from 'query-string'
moment.locale();  
const Chat = props => {
  const [message, setMessage] = useState('')
  const [user, setUser] = useState({ uid: 0, })
  const [imageZoom, setImageZoom] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')
  const [boxedListUser, setBoxedListUser] = useState(false)
  const [listUser, setListUser] = useState([])

  const scrollToBottom = () => {
    const chat = document.getElementById("chatList");
    chat.scrollTop = chat.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
    setUser({ uid: props.user.uid, })
    
    const textRequest = props.messages.filter(message => message.type === 'text-request')
    if(textRequest.length !== 0){
      // sendMessage(textRequest[0])
    }
    let roomname = qs.parse(window.location.search).room
    let username = qs.parse(window.location.search).user
    Axios({
      method: 'get',
      url: `${process.env.REACT_APP_SERVER_API}/room/getlistuserbyroom`,
      params: {
        roomname, username
      }
    }).then(res => {
      const { data } = res;
      const hostStream = data.data[0];
      const listUser = data.data.slice(1, data.data.length)
      setListUser(listUser)
    })
    
  }, [props])

  const sendMessage = (msg) => {
    props.sendMessage(msg);
    scrollToBottom()
  } 

  const handleSubmit = event => {
    if (message === '') return
    event.preventDefault();
    sendMessage({ type: 'text', message: { id: user.uid, sender: { uid: user.uid, }, data: { text: message } } })
    setMessage('')
  };

  const handleChange = event => {
    setMessage(event.target.value)
  }
  const handleDownload = (path) => {
      const url = path
      const link = document.createElement('a');
      link.setAttribute("href", `${process.env.REACT_APP_SERVER_API}/${url}`);
      link.setAttribute("download", ''); //! 안 됨 
      link.setAttribute("target", '_blank');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }
  const renderMessage = (userType, data) => {
    // console.log('===========', data)
    const message = data.message
    const {  isMainRoom } = props;
    const { type } = data;
    let msgDiv;
    if(type === 'text'){
      msgDiv = (
        <div className="msg-type">
          <div className="msg-type__info">
              <span className="msg-type__name">{message.sender.username}</span>
              <span className="msg-type__time">{moment().format('LT')}</span>
          </div>
          <div className="msg-type__message"> {message.data.text}</div>
        </div>
      )
    }else if(type === 'text-request'){
      //display host room
        if(isMainRoom){
          const requestType  =  message.data.text === '질문 요청' ? 'question' : 'out';
          const messageInfo = message.data.text === '질문 요청' ? `${message.sender.username}학생이 질문을 요청하였습니다.`:
          `${message.sender.username}학생이 자리비움을 요청하였습니다.`
          msgDiv = (
            <div className="msg-request">
              <div className="msg-request__heading">
                <p>{messageInfo}</p>
                <span>{moment().format('LT')}</span></div>
              <div className="msg-request__button mobile">   
                <button onClick={() => props.handleActionRequestUser(message.id, "accept", requestType)}>수락</button>
                <button onClick={() => props.handleActionRequestUser(message.id, "reject", requestType)}>취소</button>
              </div>
            </div>
            )
        }
        else{
          const messageInfo = message.data.text === '경고 메시지 받았습니다 ' ? message.data.text :
          `${message.data.text} 하였습니다.`;
          msgDiv = (
            <div className="msg-request">
              <div className="msg-request__heading">{messageInfo}<span>{moment().format('LT')}</span></div>
            </div>
          )
        }
      }
    else if(type === 'file'){
      const { data } = message
      msgDiv = (
        <div className="file-type">
          <div className="file-type__info">
              <span className="file-type__name">{message.sender.username}</span>
              <span className="file-type__time">{moment().format('LT')}</span>
          </div>
          <div className="file-type__message"> 
            <p>{message.data.text}</p>
            {/* <p>요효기간 ~ <span>2020.09.30</span></p> */}
            <p className="file-type__size">용량 : <span>{(data.size / 1000).toFixed(2)} KB</span></p>
            <button className = "file-type__btn"onClick={() => handleDownload(data.fileHash)}>다운로드</button>
          </div>
        </div>
        )
    }
    else if(type === "text-alert"){
      const { data } = message
      const messageInfo = message.sender.username+ " " + data.text;
      msgDiv = (
        <div className="msg-request">
          <div className="msg-request__heading">
            <p>{messageInfo}</p>
            <span>{moment().format('LT')}</span></div>
        </div>
      )
      
    }else{
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
                cursor: 'pointer',
              }}
              alt="update img"
              src={message.data} />
          </div>
        )
    }

    return (<li className={userType} >{msgDiv}</li>)

  }

  const showEnlargedImage = (data) => {
    return (<img
      alt="update img"
      src={data}
      style={{
        backgroundColor: 'black',
        position: 'relative',
        zIndex: 100,
        display: 'block',
        cursor: 'pointer',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: 20,
        borderRadius: 20,
      }}
      onClick={() => setImageZoom(false)}
    />)
  }
  const handleValueFile = (e) => {
    // const { name, size, type } = e.target.files[0];
    let roomname = qs.parse(window.location.search).room;
    let params = {
      roomname
    }
    const { size } = e.target.files[0];
    if((size / 1000000) < 100){
      let data = new FormData();
      data.append('file', e.target.files[0])
      data.append('params', JSON.stringify(params))
      Axios.post(`${process.env.REACT_APP_SERVER_API}/room/upfile`, data, {
          headers: {
              'Content-Type': 'application/json',
          }
        }
      )
    }else{
      alert("파일 공유 용량제한이 100MB이하 입니다.")
    }
  }   

  const handleClickUpFile = () => {
      const upFile = document.createElement('input');
      upFile.setAttribute('type','file');
      upFile.setAttribute('name','file');
      upFile.setAttribute('style','display: none');
      document.body.appendChild(upFile);
      upFile.click();
      upFile.onchange=handleValueFile
  }

  const handleClickCameraOn = () => {
      const upImage = document.createElement('input');
      upImage.setAttribute('type','file');
      upImage.setAttribute('name','file');
      upImage.setAttribute('accept','image/*');
      upImage.setAttribute('style','display: none');
      document.body.appendChild(upImage);
      upImage.click();
      upImage.onchange=handleValueFile
  }
  return (
    <div style={{
      height: '100%',
      // background: 'red',
      position: 'relative'
    }}>
      {imageZoom && showEnlargedImage(selectedImage)}
      <div className="chat-task"> 
        <span className="chat-task__file">
          <i className="material-icons" onClick={() => handleClickUpFile()}>
            link
          </i>
        </span>
        {
          props.isMainRoom &&
          <span className="chat-task__offchat">
            <i className="material-icons" onClick={() => setBoxedListUser(!boxedListUser)}>
              chat
            </i>
            {
              boxedListUser &&
              <div className="list-user-chat">
                <ul>
                  
                  {
                    listUser.length !== 0 &&
                    <>
                      <li onClick={() => 
                          {
                              props.handleOffChatForUser("allmute","disable_chatting","disable_chatting")
                              setBoxedListUser(!boxedListUser)
                          }}>1. 전체
                      </li>
                      {
                        listUser.map((user,idx) => (
                          <li onClick={() => 
                            {
                              props.handleOffChatForUser(user.socket_id,"disable_chatting","disable_chatting")
                              setBoxedListUser(!boxedListUser)
                          }} key = {idx} >{idx + 2}.{user.username}</li>
                        ))
                      }
                    </>
                  }
                </ul>
              </div>
            }
          </span>
        }
        <span className="chat-task__camera">
          <i className="material-icons" onClick={() => handleClickCameraOn()}>
            camera
          </i>
        </span>
      </div>

      <div className="chatWindow" style={{
        zIndex: 10,
        // position: 'absolute',
        // right: 5,
        // top: 190,
        bottom: 0,
        width: '100%',
        height: '96%',
      }}>
        <ul className="chat" id="chatList">
          {props.messages.map(data => (
            <div key={data.id}>
              {user.uid === data.message.sender.uid ? renderMessage('self', data) : (renderMessage('other', data))}
            </div>
          ))}
        </ul>
        {/* <DragDrop
          className="chatInputWrapper"
          sendFiles={(files) => {
            console.log(files)
            const reader = new FileReader()
            reader.onload = (e) => {
              console.log(e)
              //https://blog.mozilla.org/webrtc/large-data-channel-messages/
              //https://lgrahl.de/articles/demystifying-webrtc-dc-size-limit.html
              sendMessage({ type: 'image', message: { id: user.uid, sender: { uid: user.uid, }, data: e.target.result } })
              // const maximumMessageSize = 65535 //65535 <=== 64KiB // 16384 <=== 16KiB to be safe
              // if (e.target.result.length <= maximumMessageSize){}
              // else
              //   alert('Message exceeds Maximum Message Size!')
            }
            reader.readAsDataURL(files[0])
          }}
        > */}
          <div>
            <form onSubmit={handleSubmit}>
              <input
                className="textarea input"
                type="text"
                placeholder={props.normalUserChat ? "채팅 금지 상태입니다 ..." : "채팅 ..."}
                onChange={handleChange}
                value={message}
                readOnly={props.normalUserChat}
                style={props.normalUserChat ? {border: '2px solid red'} : {}}
              />
            </form>
          </div>
        {/* </DragDrop> */}
      </div>
    </div>
  )
}

export default Chat