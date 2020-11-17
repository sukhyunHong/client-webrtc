// https://www.freecodecamp.org/news/building-a-modern-chat-application-with-react-js-558896622194/
import React, { useState, useEffect, useRef } from 'react'
import DragDrop from '../DragDrop'
import './style.scss'
import moment from 'moment'
moment.locale();  

const Chat = props => {
  const [message, setMessage] = useState('')
  const [user, setUser] = useState({ uid: 0, })
  const [imageZoom, setImageZoom] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

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
    // console.log(textRequest)
    
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

  const renderMessage = (userType, data) => {
    // console.log('===========', data)
    const message = data.message
    console.log(message)
    const { normalUserChat, isMainRoom } = props;
    const { type } = data;
    let msgDiv;
    if(type === 'text'){
      msgDiv = (
        <div className="msg-type">
          <div className="msg-type__message"> {message.data.text}</div>
          <div className="msg-type__wrapper-info">
              <span className="msg-type__name">{message.sender.username}</span>
              <span className="msg-type__time">{moment().format('LT')}</span>
          </div>
        </div>
      )
    }else if(type =='text-request'){
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
      //display user
      else{
        const messageInfo = message.data.text === '경고 메시지 받았습니다 ' ? message.data.text :
        `${message.data.text} 하였습니다.`;
        msgDiv = (
          <div className="msg-request">
            <div className="msg-request__heading">{messageInfo}<span>{moment().format('LT')}</span></div>
          </div>
        )
      }
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
              src={message.data} />
          </div>
        )
    }
    // const msgDiv = data.type === 'text' && (
    //   <div className="msg">
    //     <p>{message.sender.username}</p>
    //     <div className="message"> {message.data.text}</div>
    //   </div>
    // ) || (
    //     <div className="msg">
    //       <p>{message.sender.username}</p>
    //       <img
    //         onClick={() => {
    //           setImageZoom(true)
    //           setSelectedImage(message.data)
    //         }}
    //         className="message"
    //         style={{
    //           width: 200,
    //           // height: 100
    //           cursor: 'pointer',
    //         }}
    //         src={message.data} />
    //     </div>
    //   )

    return (<li className={userType} >{msgDiv}</li>)

  }

  const showEnlargedImage = (data) => {
    return (<img
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

  console.log(props.messages)
  return (
    <div style={{
      height: '100%',
      // background: 'red',
      position: 'relative'
    }}>
      {imageZoom && showEnlargedImage(selectedImage)}

      <div className="chatWindow" style={{
        zIndex: 10,
        position: 'absolute',
        // right: 5,
        // top: 190,
        bottom: 0,
        width: '100%',
        height: '100%',
      }}>
        <ul className="chat" id="chatList">
          {props.messages.map(data => (
            <div key={data.id}>
              {user.uid === data.message.sender.uid ? renderMessage('self', data) : (renderMessage('other', data))}
            </div>
          ))}
        </ul>
        <DragDrop
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
        >
          <div>
            <form onSubmit={handleSubmit}>
              <input
                className="textarea input"
                type="text"
                placeholder={props.normalUserChat ? "문자 메시지 금지 상태입니다 ..." : "문자 메시지 ..."}
                onChange={handleChange}
                value={message}
                readOnly={props.normalUserChat}
                style={props.normalUserChat ? {border: '2px solid red'} : {}}
              />
            </form>
          </div>
        </DragDrop>
      </div>
    </div>
  )
}

export default Chat