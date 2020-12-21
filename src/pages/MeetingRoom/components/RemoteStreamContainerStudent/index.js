import React, { Component, useCallback, useState } from 'react'
import styled from 'styled-components'
import qs from 'query-string'
import Video from '../Video'
import Axios from "axios"
import ReactLoading from 'react-loading'
import CountTime from '../../../../components/CountTime'
import './style.scss'
import { getInformationRoom } from './RemoteStreamContainerStudent.Service'
import CountDownTime from '../../../../components/CountDownTime'
import getSocket from '../../../rootSocket'
class RemoteStreamContainerStudent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      rVideos: [],
      remoteStreams: [],

      selectedVideo: null,
      videoVisible: false,
      loading: false,

      displayTaskVideo: false,

      lecOutState: false,
    }
  }
  componentDidMount(){
    //질문 요청의 상태를 알람
    getSocket().on("alert-user-process-req-question", data => {
      console.log(data)
    })

    //자리비움 요청의 상태를 알림
    getSocket().on("alert-user-process-req-lec-out", data => {
      console.log(data)
    })
  }
  
  videoMuted = rVideo => {
    const muteTrack = rVideo.getVideoTracks()[0]
    const isSelectedVideo = rVideo.id === this.state.selectedVideo.stream.id
    if (isSelectedVideo) {
      this.setState({
        videoVisible: !muteTrack.muted
      })
    }
  }

  switchVideo = _video => {
    const muteTrack = _video.stream.getVideoTracks()[0]
    this.setState({
      selectedVideo: _video,
      videoVisible: !muteTrack.muted
    })
  }
  render() {
    const { testConcentration, outEnable } = this.props
    const { lecOutState } = this.state
    console.log("aaa", this.props.remoteStreams)
    return (
      <div className="remote-stream__container">
        <div className="single-video">
          <VideoItem
            rVideo={this.props.remoteStreams.length !== 0 && this.props.remoteStreams[0]}
            lecOutEable={lecOutState}
          />
          {/* <div className="single-video__body">
            <Video
              videoType="previewVideo"
              videoStyles={{
                width: "100%",
                height: "100%",
                visibility: "visible",
                objectFit: "initial"
              }}
              videoStream={
                this.props.remoteStreams.length !== 0 && this.props.remoteStreams[0].stream
              }
            /> */}
            {/* {testConcentration.state ? (
              <InputTestConcentration
                testNumber={testConcentration.number}
                handleCorrectInput={this.props.handleCorrectInput}
                handleDownAllTime={this.props.handleDownAllTime}
              />
            ) : (
                outEnable && (
                  <div className="wrapper-outState">
                    <div>
                      <h3>자리비움 중</h3>
                      <CountTime />
                      <button onClick={() => this.props.handleCancelOut()}>
                        복귀하기
                        </button>
                    </div>
                  </div>
                )
              )} */}
          {/* <div className="single-video__footer">
                <i
                  className="material-icons"
                  onClick={() => this.props.handleUserOutRoom()}
                >
                  input
                </i>
                <div>
                  <button onClick={() => this.props.handleRequestQuestion()}>
                    음성 질문 요청
                  </button>
                  <button onClick={() => this.props.handleRequestGoOut()}>
                    자리 비움 요청
                  </button>
                </div>
                <span>수학 - 제1강 집합</span>
              </div> */}
        </div>
      </div>
    )
  }
}
const VideoItem = ({rVideo, username}) => {





  const handleCorrectInput = () => {

  }
  const handleDownAllTime = () => {
    
  }
  return (
    <div className="single-video__body">
      <Video
        videoType="previewVideo"
        videoStyles={{
          width: "100%",
          height: "100%",
          visibility: "visible",
          objectFit: "initial"
        }}
        videoStream={rVideo.stream}
      />
      
      {/* 
      //!시간 및 숙자를 세팅 해야됨
      <InputTestConcentration
        testNumber={4}
        handleCorrectInput={() => handleCorrectInput()}
        handleDownAllTime={() => handleDownAllTime()}
      /> */}
    </div>
  )
}

const InputTestConcentration = React.memo(
  ({ testNumber, handleCorrectInput, handleDownAllTime }) => {
    const [number, setNumber] = useState()
    const [checkInput, setCheckInput] = useState(false)
    const [displayWrapper, setDisplayWrapper] = useState(true)
    const handleSubmitInput = e => {
      e.preventDefault()
      if (number !== testNumber) setCheckInput(true)
      else {
        setCheckInput(false)
        setDisplayWrapper(false)
        handleCorrectInput()
      }
    }
    const handleDownAllTimeCallback = useCallback(() => {
      setDisplayWrapper(false)
      handleDownAllTime()
    })
    console.log(displayWrapper)
    if (displayWrapper) {
      return (
        <div className="test-wrapper">
          <div>
            <h2>집중도 테스트</h2>
            <CountDownTime handleDownAllTime={() => handleDownAllTimeCallback()} />
            <h1>{testNumber}</h1>
            <form onSubmit={e => handleSubmitInput(e)}>
              <input
                type="text"
                className="input-number"
                onChange={e => setNumber(Number(e.target.value))}
              />
              {checkInput && <p>올바른 숫자 입력하세요</p>}
            </form>
          </div>
        </div>
      )
    } else return ""
  }
)
const WrapperLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`
export default RemoteStreamContainerStudent