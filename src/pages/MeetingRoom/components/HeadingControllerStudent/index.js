import React, { useState } from "react"
import Icon from "../../../../constants/icons"
import { useDispatch, useSelector } from 'react-redux';
import headingControllerAction from './HeadingControllerStudent.Action'
import './style.scss'
import headingControllerStudentSocket from './HeadingControllerStudent.Socket'

function HeadingControllerStudent({handleOutRoom}) {

  const dispatch = useDispatch();

  const handleRequestQuestion = () => {
    headingControllerStudentSocket.emitUserRequestQuestion();
  }

  const handleRequestLecOut = () => {
    headingControllerStudentSocket.emitUserRequestLecOut();
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
          <li className="request-task"><button onClick={() => handleRequestQuestion()}>음성질문 요청</button></li>
          <li className="request-task"><button onClick={() => handleRequestLecOut()}>자리비움 요청</button></li>
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
