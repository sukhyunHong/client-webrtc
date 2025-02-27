import React, { Component, useCallback, useState } from "react"
import Video from "../Video"
import qs from "query-string"
import Axios from "axios"
import ReactLoading from "react-loading"
import styled from "styled-components"


import CountTime from "../../../../components/CountTime"
import CountDownTime from "../../../../components/CountDownTime"
import "./style.scss"
class RemoteStreamContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      rVideos: [],
      remoteStreams: [],

      selectedVideo: null,
      videoVisible: false,
      loading: false,

      displayTaskVideo: false
    }
  }
  componentDidMount() {
    if (this.props.remoteStreams.length !== 0) {
      const { remoteStreams, requestUser } = this.props
      let roomname = qs.parse(window.location.search).room
      let username = qs.parse(window.location.search).user

      Axios({
        method: "get",
        url: `${process.env.REACT_APP_SERVER_API}/room/getlistuserbyroom`,
        params: {
          roomname,
          username
        }
      }).then(res => {
        const { data } = res
        const hostStream = data.data[0]
        const listUser = data.data.slice(1, data.data.length)

        let selectedVideo = {}
        selectedVideo = this.state.selectedVideo
          ? remoteStreams.remoteStreams.filter(
              stream => stream.id === hostStream.socket_id
            )
          : []
        selectedVideo = selectedVideo.length ? selectedVideo[0] : []

        let _rVideos = remoteStreams.map((rVideo, index) => {
          const _videoTrack = rVideo.stream
            .getTracks()
            .filter(track => track.kind === "video")
          const requestValue = requestUser.filter(
            element => element.remoteId === rVideo.name
          )
          let infoStreamBySocketId = listUser.filter(
            element => element.socket_id === rVideo.name
          )
          infoStreamBySocketId = infoStreamBySocketId.length
            ? infoStreamBySocketId[0]
            : hostStream.username
          if (infoStreamBySocketId.length === 0) {
            return null
          } else
            infoStreamBySocketId = infoStreamBySocketId.length
              ? infoStreamBySocketId[0]
              : hostStream.username

          let video = _videoTrack ? (
            <div className="video-item">
              <Video
                videoMuted={this.videoMuted}
                videoType="remoteVideo"
                videoStream={rVideo.stream}
              />
              <div
                className="btn-wrapper"
                style={requestValue.length === 1 ? { display: "none" } : {}}
              >
                <div>
                  <h1>{infoStreamBySocketId.username}</h1>
                  <div className="btn-list">
                    <button
                      onClick={() =>
                        this.props.handleUserWarning(
                          rVideo.name,
                          "warning",
                          "warning"
                        )
                      }
                    >
                      경고
                    </button>
                    <button
                      onClick={() =>
                        this.props.handleDisableChattingToUser(
                          rVideo.name,
                          "disable_chatting",
                          "disable_chatting"
                        )
                      }
                    >
                      채팅금지
                    </button>
                  </div>
                </div>
              </div>
              {requestValue.length === 1 ? (
                //자리 비움 요청
                requestValue[0].type === "out" ? (
                  requestValue[0].state ? (
                    <div className="wrapper-request">
                      <div>
                        <p className="wrapper-request__name">
                          {requestValue[0].remoteUsername}
                        </p>
                        <CountTime />
                      </div>
                    </div>
                  ) : (
                    <div className="wrapper-request">
                      <div>
                        <p className="wrapper-request__name">
                          {requestValue[0].remoteUsername}
                        </p>
                        <p className="wrapper-request__type">
                          <span>자리비움</span> 요청
                        </p>
                        <div className="wrapper-request__btn">
                          <button
                            className="wrapper-request__btn--reject"
                            onClick={() =>
                              this.props.handleActionRequestUser(
                                rVideo.name,
                                "reject",
                                requestValue[0].type
                              )
                            }
                          >
                            거절
                          </button>
                          <button
                            className="wrapper-request__btn--accept"
                            onClick={() =>
                              this.props.handleActionRequestUser(
                                rVideo.name,
                                "accept",
                                requestValue[0].type
                              )
                            }
                          >
                            수락
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : //질문 요청
                requestValue[0].state ? (
                  <div className="wrapper-request">
                    <div>
                      <p className="wrapper-request__name">
                        {requestValue[0].remoteUsername}
                      </p>
                      <p>
                        <i className="material-icons">mic</i>
                      </p>
                      <div className="wrapper-request__btn">
                        <button
                          className="wrapper-request__btn--end"
                          onClick={() =>
                            this.props.handleActionRequestUser(
                              rVideo.name,
                              "reject",
                              requestValue[0].type
                            )
                          }
                        >
                          질문 요청 완료
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="wrapper-request">
                    <div>
                      <p className="wrapper-request__name">
                        {requestValue[0].remoteUsername}
                      </p>
                      <p className="wrapper-request__type">
                        <span>질문</span> 요청
                      </p>
                      <div className="wrapper-request__btn">
                        <button
                          className="wrapper-request__btn--reject"
                          onClick={() =>
                            this.props.handleActionRequestUser(
                              rVideo.name,
                              "reject",
                              requestValue[0].type
                            )
                          }
                        >
                          거절
                        </button>
                        <button
                          className="wrapper-request__btn--accept"
                          onClick={() =>
                            this.props.handleActionRequestUser(
                              rVideo.name,
                              "accept",
                              requestValue[0].type
                            )
                          }
                        >
                          수락
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                ""
              )}
            </div>
          ) : (
            ""
          )

          return video
        })
        this.setState({
          remoteStreams: remoteStreams,
          rVideos: _rVideos,
          ...selectedVideo,
          loading: true
        })
      })
    }
  }
  componentWillReceiveProps(nextProps) {
    if (
      this.props.remoteStreams !== nextProps.remoteStreams ||
      this.props.requestUser !== nextProps.requestUser ||
      this.props.paintScream !== nextProps.paintScream
    ) {
      const NoOfRemoteStreams = nextProps.remoteStreams.length

      let selectedVideo = {}

      let roomname = qs.parse(window.location.search).room
      let username = qs.parse(window.location.search).user

      Axios({
        method: "get",
        url: `${process.env.REACT_APP_SERVER_API}/room/getlistuserbyroom`,
        params: {
          roomname,
          username
        }
      }).then(res => {
        const { data } = res
        const hostStream = data.data[0]
        const listUser = data.data.slice(1, data.data.length)
        //2명
        if (NoOfRemoteStreams === 1)
          selectedVideo = { selectedVideo: nextProps.remoteStreams[0] }
        else {
          selectedVideo = this.state.selectedVideo
            ? nextProps.remoteStreams.filter(
                stream => stream.id === hostStream.socket_id
              )
            : []
          selectedVideo = selectedVideo.length
            ? selectedVideo[0]
            : { selectedVideo: nextProps.remoteStreams[NoOfRemoteStreams - 1] }
        }
        let _rVideos = nextProps.remoteStreams.map((rVideo, index) => {
          const _videoTrack = rVideo.stream
            .getTracks()
            .filter(track => track.kind === "video")
          const requestValue = nextProps.requestUser.filter(
            element => element.remoteId === rVideo.name
          )

          let infoStreamBySocketId = listUser.filter(
            element => element.socket_id === rVideo.name
          )

          if (infoStreamBySocketId.length === 0) {
            return null
          } else
            infoStreamBySocketId = infoStreamBySocketId.length
              ? infoStreamBySocketId[0]
              : hostStream.username

          let video = _videoTrack ? (
            <div className="video-item">
              <Video
                viewStateMicAndCam={true}
                videoMuted={this.videoMuted}
                videoType="remoteVideo"
                videoStream={rVideo.stream}
              />
              <div
                className="btn-wrapper"
                style={requestValue.length === 1 ? { display: "none" } : {}}
              >
                <div>
                  <h1>{infoStreamBySocketId.username}</h1>
                  <div className="btn-list">
                    <button
                      onClick={() =>
                        this.props.handleUserWarning(
                          rVideo.name,
                          "warning",
                          "warning"
                        )
                      }
                    >
                      경고
                    </button>
                    <button
                      onClick={() =>
                        this.props.handleDisableChattingToUser(
                          rVideo.name,
                          "disable_chatting",
                          "disable_chatting"
                        )
                      }
                    >
                      채팅금지
                    </button>
                  </div>
                </div>
              </div>
              {requestValue.length === 1 ? (
                //자리 비움 요청
                requestValue[0].type === "out" ? (
                  requestValue[0].state ? (
                    <div className="wrapper-request">
                      <div>
                        <p className="wrapper-request__name">
                          {requestValue[0].remoteUsername}
                        </p>
                        <CountTime />
                      </div>
                    </div>
                  ) : (
                    <div className="wrapper-request">
                      <div>
                        <p className="wrapper-request__name">
                          {requestValue[0].remoteUsername}
                        </p>
                        <p className="wrapper-request__type">
                          <span>자리비움</span> 요청
                        </p>
                        <div className="wrapper-request__btn">
                          <button
                            className="wrapper-request__btn--reject"
                            onClick={() =>
                              this.props.handleActionRequestUser(
                                rVideo.name,
                                "reject",
                                requestValue[0].type
                              )
                            }
                          >
                            거절
                          </button>
                          <button
                            className="wrapper-request__btn--accept"
                            onClick={() =>
                              this.props.handleActionRequestUser(
                                rVideo.name,
                                "accept",
                                requestValue[0].type
                              )
                            }
                          >
                            수락
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : //질문 요청
                requestValue[0].state ? (
                  <div className="wrapper-request">
                    <div>
                      <p className="wrapper-request__name">
                        {requestValue[0].remoteUsername}
                      </p>
                      <p>
                        <i className="material-icons">mic</i>
                      </p>
                      <div className="wrapper-request__btn">
                        <button
                          className="wrapper-request__btn--end"
                          onClick={() =>
                            this.props.handleActionRequestUser(
                              rVideo.name,
                              "reject",
                              requestValue[0].type
                            )
                          }
                        >
                          질문 요청 완료
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="wrapper-request">
                    <div>
                      <p className="wrapper-request__name">
                        {requestValue[0].remoteUsername}
                      </p>
                      <p className="wrapper-request__type">
                        <span>질문</span> 요청
                      </p>
                      <div className="wrapper-request__btn">
                        <button
                          className="wrapper-request__btn--reject"
                          onClick={() =>
                            this.props.handleActionRequestUser(
                              rVideo.name,
                              "reject",
                              requestValue[0].type
                            )
                          }
                        >
                          거절
                        </button>
                        <button
                          className="wrapper-request__btn--accept"
                          onClick={() =>
                            this.props.handleActionRequestUser(
                              rVideo.name,
                              "accept",
                              requestValue[0].type
                            )
                          }
                        >
                          수락
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                ""
              )}
            </div>
          ) : (
            ""
          )

          return video
        })
        this.setState({
          remoteStreams: nextProps.remoteStreams,
          rVideos: _rVideos,
          ...selectedVideo,
          loading: true
        })
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
    const { testConcentration, outEnable } = this.props
    if (!loading) {
      return (
        <WrapperLoading className="loading">
          <ReactLoading type="spin" color="#000" />
        </WrapperLoading>
      )
    }
    return (
      <div className="left-content__container">
        {
          //강인 경우에는 여러 사람이 출력함
          this.props.isMainRoom ? (
            <div className="list-videos">
              <div className={`video-${this.state.remoteStreams.length}`}>
                {this.state.rVideos}
              </div>
            </div>
          ) : (
            //학생인 경우애는
            //강사 출력함
            <div className="single-video">
              <div className="single-video__body">
                <Video
                  videoType="previewVideo"
                  videoStyles={{
                    width: "100%",
                    height: "100%",
                    visibility: "visible",
                    objectFit: "initial"
                  }}
                  videoStream={
                    this.state.selectedVideo && this.state.selectedVideo.stream
                  }
                />
                {testConcentration.state ? (
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
                )}
              </div>
              <div className="single-video__footer">
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
              </div>
            </div>
          )
        }
      </div>
    )
  }
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

    if (displayWrapper) {
      return (
        <div className="test-wrapper">
          <div>
            <h2>집중도 테스트</h2>
            <CountDownTime handleDownAllTime={handleDownAllTimeCallback()} />
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

export default RemoteStreamContainer
