import React, { useEffect, useState } from "react"
import Icon from "../../../../constants/icons"
import { useDispatch, useSelector } from 'react-redux';
import headingControllerAction from './HeadingControllerStudent.Action'
import './style.scss'
import headingControllerStudentSocket from './HeadingControllerStudent.Socket'

function HeadingControllerStudent({handleOutRoom}) {


  const dispatch = useDispatch();
  const [resize, setReSize] = useState(false)

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', () => {})
    }
  }, [])

  const handleRequestQuestion = () => {
    headingControllerStudentSocket.emitUserRequestQuestion();
  }

  const handleRequestLecOut = () => {
    headingControllerStudentSocket.emitUserRequestLecOut();
  }
 const  handleResize = () => {
      setReSize(!resize)
  };

  let height = document.getElementById("video-body") ?  document.getElementById("video-body").getBoundingClientRect().height : null;
  if(!height){
    height = document.getElementById("left-content-id") ?  document.getElementById("left-content-id").getBoundingClientRect().height : null
    console.log("first", height)
  }
  let width = (height * 4) / 3
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
