import React, { Component, useCallback, useState } from 'react'
import styled from 'styled-components'
import qs from 'query-string'
import Video from '../../Video'
import Axios from "axios"
import ReactLoading from 'react-loading'
import CountTime from '../../../../../components/CountTime'
import './style.scss'
import { getInformationRoom, getLectureInfo } from '../RemoteStreamContainer.Service'
import CountDownTime from '../../../../../components/CountDownTime'
import getSocket from '../../../../rootSocket'

let intervalTime = "";
class RemoteStreamContainerStudent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      rVideos: [],
      remoteStream: null,

      selectedVideo: null,
      videoVisible: false,
      loading: true,

      displayTaskVideo: false,

      resize: false,
      lecOutState: false,
    }
  }

  componentDidMount() {
    if (this.props.remoteStreams.length !== 0) {
      this.setState({
        remoteStream: this.props.remoteStreams[0],
        loading: false
      })
    }

    //!!store 저장할 필요함
    window.addEventListener('resize', this.handleResize);
    //질문 요청의 상태를 알람
    getSocket().on("alert-user-process-req-question", data => {
      
    })
    //자리비움 요청의 상태를 알림
    getSocket().on("alert-user-process-req-lec-out", data => {
      console.log(data)
    })

    const UserRoomId = () => {
      return JSON.parse(window.localStorage.getItem("usr_id"))
    }

    let params = {
      userroom_id: UserRoomId()
    }

    const fetchData = async () => {
      const resp = await getLectureInfo(params)
      const { test_gap } = resp.data
      let time = test_gap === "01" ? 10 : test_gap === "02" ? 20 : test_gap === "03" ? 30 : 40;
      intervalTime = setInterval(() => {
        var min = 1,
          max = 9;
        var rand = Math.floor(Math.random() * (max - min + 1) + min);
        // this.sendToPeer("test-concentration", {
        //   number: rand
        // } , null);
      }, 1000 * Number(time) * 60);
    }
    fetchData()

  }
  handleResize = () => {
    this.setState({ resize: !this.state.resize })
  };

  componentWillUnmount() {
    window.removeEventListener('resize', () => { })
    clearInterval(intervalTime)
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.remoteStreams !== nextProps.remoteStreams) {
      this.setState({
        remoteStream: nextProps.remoteStreams[0],
        loading: false
      })
    }
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
    const { loading } = this.state
    if (loading) {
      return (
        <WrapperLoading className="loading">
          <ReactLoading type="spin" color="#000" />
        </WrapperLoading>
      )
    }
    const { testConcentration, outEnable } = this.props
    const { lecOutState } = this.state;

    let height = document.getElementById("video-body") ? document.getElementById("video-body").getBoundingClientRect().height : null;
    if (!height) {
      height = document.getElementById("left-content-id") ? document.getElementById("left-content-id").getBoundingClientRect().height : null
    }
    let width = (height * 4) / 3
    return (
      <div className="remote-stream__container">
        <div className="single-video">
          <div className="single-video__body" id="video-body" style={{ width }}>
            {
              this.props.remoteStreams.length !== 0 ?
                <VideoItem
                  rVideo={this.state.remoteStream}
                  lecOutEable={lecOutState}
                /> :
                <ReactLoading />
            }
          </div>
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
const VideoItem = ({ rVideo, username }) => {


  const handleCorrectInput = () => {

  }
  const handleDownAllTime = () => {

  }
  return (
    <>
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
    </>
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