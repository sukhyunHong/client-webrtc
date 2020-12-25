import React, { useState } from "react"
import Icon from "../../../../../constants/icons"
import './style.scss'
import { useDispatch, useSelector } from 'react-redux';
import meetingRoomSelectors from '../../../MeetingRoom.Selector'
import CountTime from "../../../../../components/CountTime";

import headingControllerAction from '../HeadingController.Action'

function HeadingController({handleOutRoom, handleWindowSize, handleScreenMode, handleWhiteBoard, handleScreamRecording}) {

  const dispatch = useDispatch();
  const localStreamState = useSelector(meetingRoomSelectors.getLocalStream);

  const [soundState, setSoundState] = useState(false)
  const [micState, setMicState] = useState(false)
  const [camState, setCamState] = useState(false)
  const [recording, setRecording] = useState(false)
  const [windowSize, setWindowSize] = useState(false)

  const handleChangeWindowSize = () => {
    setWindowSize(!windowSize)
    if(!windowSize){
      document.documentElement.requestFullscreen();
    } else{
      if(document.fullscreenElement !== null)
          document.exitFullscreen();
    }
    handleWindowSize()
  }
  const handleSoundState = () => {
    setSoundState(!soundState)
    dispatch(headingControllerAction.handleChangeSoundState())
  }
  const handleMicState = () => {
    setMicState(!micState)
    dispatch(headingControllerAction.handleChangeMicState())
  }
  const handleCamState = () => {
    setCamState(!camState)
    dispatch(headingControllerAction.handleChangeCamState())
  }
  const handleRecording = () => {
    setRecording(!recording)
    handleScreamRecording()
  }
  return <div className="heading-stream__controller">
    <div className={windowSize ? "heading-container__big" : "heading-container__small"}>
      <div className="heading-col">
        <ul>
          <li><img onClick={() => handleOutRoom()}  src={Icon.lecOutIcon} /></li>
          <li><img onClick={() => handleChangeWindowSize()} src={windowSize ? Icon.lecWindowSmallIcon : Icon.lecWindowBigIcon} /> </li>
        </ul>
      </div>
      <div className="heading-col">
        <ul>
          <li><img onClick={() => handleSoundState()} src={soundState ? Icon.lecSoundOffIcon : Icon.lecSoundOnIcon} /></li>
          <li><img onClick={() => handleMicState()} src={micState ? Icon.lecMicOffIcon : Icon.lecMicOnIcon}  /></li>
          <li><img onClick={() => handleCamState()} src={camState ? Icon.lecCamOffIcon : Icon.lecCamOnIcon} /></li>
          <li><img onClick={() => handleRecording()} src={recording ? Icon.lecPauseIcon : Icon.lecRecodingIcon} /></li>
          {
            recording &&
            <li className="record-time"><CountTime /></li>
          }
        </ul>
      </div>
      <div className="heading-col">
        <ul>
          <li><img onClick={() => handleScreenMode()} src={Icon.lecScreenMode} /></li>
          <li><img onClick={() => handleWhiteBoard()} src={Icon.lecScreenMode} /> </li>
        </ul>
      </div>
    </div>
  </div>
}


export default HeadingController
