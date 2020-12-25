import React, { useEffect, useState } from "react"
import Icon from "../../../../../constants/icons"
import { useDispatch, useSelector } from 'react-redux';
import './style.scss'
import headingControllerSocket from '../HeadingController.Socket'

function HeadingControllerStudent({handleOutRoom}) {
  
  const [requestQuestion, setRequestQuestion] = useState(false)
  const [requestLecOut, setRequestLecOut] = useState(false)

  const dispatch = useDispatch();

  useEffect(() => {
    
  }, [])

  const UserRoomId = () => {
    return JSON.parse(window.localStorage.getItem("usr_id"))
  }

  const handleRequestQuestion = () => {
    setRequestQuestion(!requestQuestion)
    const payload = {
      status : requestQuestion,
      userRoomId: UserRoomId()
    }
    headingControllerSocket.emitUserRequestQuestion(payload);
  }

  const handleRequestLecOut = () => {
    setRequestQuestion(!requestQuestion)
    const payload = {
      status : requestQuestion,
      userRoomId: UserRoomId()
    }
    headingControllerSocket.emitUserRequestLecOut(payload);
  }


  return <div className="heading-stream__controller">
    <div className="heading-container__small">
      <div className="heading-col">
        <ul>
          <li><img onClick={() => handleOutRoom()}  src={Icon.lecOutIcon} /></li>
        </ul>
      </div>
      <div className="heading-col">
        <ul>
          <li className="request-task"><button onClick={() => handleRequestQuestion()}>{requestQuestion ? "음성질문 취소" : "음성질문 요청"}</button></li>
          <li className="request-task"><button onClick={() => handleRequestLecOut()}>{requestLecOut ? "자리비움 취소": "자리비움 요청"}</button></li>
        </ul>
      </div>
      <div className="heading-col">
        <ul>
          <li><p> 수학 강의 </p></li>
        </ul>
      </div>
    </div>
  </div>
}


export default HeadingControllerStudent
