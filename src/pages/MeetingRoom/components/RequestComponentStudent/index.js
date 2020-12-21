import React, { useState } from "react"
import { useDispatch, useSelector } from 'react-redux';
import Icon from "../../../../constants/icons"
import './style.scss'


function HeadingController({handleOutRoom, handleRequestQuestion, handleRequestGoOut}) {

  const dispatch = useDispatch();

  const handleRequestQuestion = () => {


  }
  const handleRequestGoOut = () => {

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
          <li><button onClick={() => handleRequestQuestion()}>음성 질문 요청</button></li>
          <li><button onClick={() => handleRequestGoOut()}>음성 질문 요청</button></li>
        </ul>
      </div>
      <div className="heading-col">
        <ul>
          <li><p>수강학</p></li>
        </ul>
      </div>
    </div>
  </div>
}


export default HeadingController
