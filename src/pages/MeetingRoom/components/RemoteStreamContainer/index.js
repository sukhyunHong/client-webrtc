import React, { Component, useState, useEffect } from 'react'
import styled from 'styled-components'
import qs from 'query-string'
import Video from '../Video'
import ReactLoading from 'react-loading'
import CountTime from '../../../../components/CountTime'
import { getInformationRoom } from './RemoteStreamContainer.Service'
import remoteStreamContainer from './RemoteStreamContainer.Socket'
import getSocket from "../../../rootSocket"
import Icon from '../../../../constants/icons'
import moment from "moment"
import './style.scss'
class RemoteStreamContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      rVideos: [],
      remoteStreams: [],
      filterRemote: [],

      selectedVideo: null,
      videoVisible: false,
      loading: false,

      displayTaskVideo: false
    }
  }
  /**
   * 먼저 API를 보내서 해당하는 방의 들어갈 사람을 체크함
   * Host누군이지를 체크하면서 Video를 출력함
   */
  //!일단 하나씩 됨 
  componentDidMount() {
    getSocket().on("alert-host-lecOut", data => {

      
      const { filterRemote } = this.state;
      const { remoteSocketId, remoteUsername } = data;
      
      //요청한 유저의 Video를 수정
      let _rVideos = filterRemote.map(rVideo => {
        const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === "video")
        const requestValue = rVideo.name === remoteSocketId ? true : false;


        const time = moment().format('DD/MM/YYYYHH:mm:ss')
        let video = _videoTrack ? (
            <VideoItem 
              rVideo={rVideo}
              username={remoteUsername}
              request={requestValue}
              time={time}
              type="request-lecOut"
            />
        ) : <img src={Icon.boardWarning}></img>
        return video
      })
      this.setState({
        rVideos: _rVideos
      })
    })

    getSocket().on("alert-host-question", data => {
      const { filterRemote } = this.state;
      const { remoteSocketId, remoteUsername } = data;

      //요청한 유저의 Video를 수정
      let _rVideos = filterRemote.map(rVideo => {
        const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === "video")
        const requestValue = rVideo.name === remoteSocketId ? true : false;
        let video = _videoTrack ? (
            <VideoItem 
              rVideo={rVideo}
              username={remoteUsername}
              request={requestValue}
              type="request-question"
            />
        ) : <img src={Icon.boardWarning}></img>
        return video
      })
      this.setState({
        rVideos: _rVideos
      })
    })

    if (this.props.remoteStreams.length !== 0) {
      const { remoteStreams } = this.props
      const fetchVideos = async () => {
        const { rVideos, filterRemote } = await setVideos(remoteStreams)
        console.log(rVideos, filterRemote)
        this.setState({
          rVideos: rVideos,
          filterRemote: filterRemote,
          loading: true
        })
      }
      fetchVideos();
    }


  }


  componentWillReceiveProps(nextProps) {
    if (
      this.props.remoteStreams !== nextProps.remoteStreams ||
      this.props.paintScream !== nextProps.paintScream
    ) {
      const fetchVideos = async () => {
        const { rVideos, filterRemote } = await setVideos(nextProps.remoteStreams)
        console.log(rVideos, filterRemote)
        this.setState({
          rVideos: rVideos,
          filterRemote: filterRemote,
          loading: true
        })
      }
      fetchVideos();
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

  render() {
    const { loading } = this.state
    if (!loading) {
      return (
        <WrapperLoading className="loading">
          <ReactLoading type="spin" color="#000" />
        </WrapperLoading>
      )
    }
    return (
      <div className="remote-stream__container">
        <div className="list-videos">
          <div className={`video-${this.state.rVideos.length}`}>
            {this.state.rVideos}
          </div>
        </div>
      </div>
    )
  }
}
//!rVideo.id = socket.id
const VideoItem = ({rVideo, username, request, type ,time}) => {
  console.log("videoeooo", request)
  const[req, setReq] = useState()

  //!체크필요함
  useEffect(() => {

    console.log('asdas')
    setReq(request)
  }, [time])
  useEffect(() => {



    
    setReq(request)
  },[])

  const handleClickWarning = (socketId) => {
    console.log(socketId)
  }

  const handleDisableChatting = (socketId) => {

  }
  
  //!정보를 저장할필요함
  const handleClickReject = () => {
    setReq(false)
    const payload = {
      type: type,
      status: "reject",
      remoteSocketId: rVideo.id
    }
    remoteStreamContainer.emitProcessRequestUser(payload)
  }

  const handleClickAccept = () => {
    setReq(false)
    const payload = {
      type: type,
      status: "accept",
      remoteSocketId: rVideo.id
    }
    remoteStreamContainer.emitProcessRequestUser(payload)
  }


  console.log(req)
  return (
    <div className="video-item">
      <Video
        viewStateMicAndCam={true}
        // videoMuted={this.videoMuted}
        videoType="remoteVideo"
        videoStream={rVideo.stream}
      />
      <div className="btn-wrapper" style={req ? { display: "none" } : {}} >
        <WrapperTaskVideo
          username={username}
          socketId={rVideo.id}
          //handleClickWarning={() => handleClickWarning(rVideo.name)}
          //handleDisableChatting={() => handleDisableChatting(rVideo.name)}
        />
      </div>
      {
        req &&
        <div className="wrapper-request" id="test">
          <WrapperUserRequest
            type={type}
            username={username}
            handleClickAccept={() => handleClickAccept()}
            handleClickReject={() => handleClickReject()}
          />
        </div>
      }
    </div>
  )
}

const setVideos = (remoteStreams) => {
  return new Promise((resolve, rej) => {
    //!두개 값을 이렇게 하면 될것같음
    let usr_id = localStorage.getItem("usr_id") 
    let data = window.localStorage.getItem("asauth")
    let { userId } = JSON.parse(data).userInfoToken
    let params = { usr_id, userId }
    console.log(params)
    getInformationRoom(params).then(res => {
      const { data } = res
      const listUser = data.slice(1, data.length)
      let _filterRemote = remoteStreams.filter(rVideo => listUser.find(({ socket_id }) => rVideo.id === socket_id) && rVideo)
      let _rVideos = _filterRemote.map((rVideo, index) => {
        const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === "video")
        let [infoStreamBySocketId] = listUser.filter(element => element.socket_id === rVideo.name)
        let video = _videoTrack ? (
          <VideoItem 
            rVideo={rVideo}
            username={infoStreamBySocketId.username}
          />
        ) : <img src={Icon.boardWarning}></img>
        return video
      })
      resolve({
        rVideos: _rVideos,
        filterRemote: _filterRemote,
      })
    })
  })
}

const WrapperUserRequest = ({ type, username, handleClickAccept, handleClickReject }) => {
  type = type === "request-question" ? "음성질문" : "자리비움";
  return (
    <div>
      <p className="wrapper-request__name">{username}</p>
      <p className="wrapper-request__type"><span>{type}</span> 요청</p>
      <div className="wrapper-request__btn">
        <button className="wrapper-request__btn--reject" onClick={() => handleClickReject()}>거절</button>
        <button className="wrapper-request__btn--accept" onClick={() => handleClickAccept()}>수락</button>
      </div>
    </div>
  )
}

//!경고데이터 저장할 필요함
//!일단 여기서 socket만 적용함
const WrapperTaskVideo = ({ username, socketId }) => {
  const handleClickWarning = () => {
    let payload = {
      remoteSocketId: socketId
    }
    remoteStreamContainer.emitHostWarning(payload)
  }
  const handleDisableChatting = () => {
    let payload = {
      remoteSocketId: socketId
    }
    remoteStreamContainer.emitHostDisableChat(payload)
  }
  return (
    <div>
      <h1>{username}</h1>
      <div className="btn-list">
        <button onClick={() => handleClickWarning()}>
          경고
        </button>
        <button onClick={() => handleDisableChatting()}>
          채팅금지
        </button>
      </div>
    </div>
  )
}

const WrapperLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`
export default RemoteStreamContainer