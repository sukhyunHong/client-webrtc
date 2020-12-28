import React, { Component, useState, useEffect } from 'react'
import { bindActionCreators } from "redux"
import styled from 'styled-components'
import qs from 'query-string'
import Video from '../../Video'
import ReactLoading from 'react-loading'
import { getInformationRoom, getLectureInfo } from '../RemoteStreamContainer.Service'
import remoteStreamContainer from '../RemoteStreamContainer.Socket'
import chatComponentSocket from '../../ChatComponent/ChatComponent.Socket'
import remoteStreamContainerAction from '../RemoteStreamContainer.Action'
import remoteStreamSelector from '../RemoteStreamContainer.Selector'
import getSocket from "../../../../rootSocket"
import Icon from '../../../../../constants/icons'
import moment from "moment"
import './style.scss'
import { connect, useDispatch } from 'react-redux'

let intervalTime = "";
class RemoteStreamContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      rVideos: [],
      remoteStreams: [],
      filterRemote: [],

      selectedVideo: null,
      videoVisible: false,
      loading: true,

      displayTaskVideo: false
    }
  }
  /**
   * 먼저 API를 보내서 해당하는 방의 들어갈 사람을 체크함
   * Host누군이지를 체크하면서 Video를 출력함
   */
  componentDidMount() {
    getSocket().on("alert-host-lecOut", data => {
      
      const { filterRemote } = this.state;
      const { remoteSocketId, status, userInfo} = data;
      console.log(filterRemote)

      //요청한 유저의 Video를 수정
      let _rVideos = filterRemote.map(rVideo => {
        const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === "video")
        const requestValue = rVideo.name === remoteSocketId ? status : false;

        const time = moment().format('DD/MM/YYYYHH:mm:ss')
        let video = _videoTrack ? (
            <VideoItem 
              rVideo={rVideo}
              userInfo={userInfo}
              request={requestValue}
              time={time}
              type="request_lecOut"
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
      const { remoteSocketId, status, userInfo} = data;

      const time = moment().format('DD/MM/YYYYHH:mm:ss')
      //요청한 유저의 Video를 수정
      let _rVideos = filterRemote.map(rVideo => {
        const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === "video")
        const requestValue = rVideo.name === remoteSocketId ? status : false;
        let video = _videoTrack ? (
            <VideoItem 
              rVideo={rVideo}
              userInfo={userInfo}
              request={requestValue}
              time={time}
              type="request_question"
            />
        ) : <img src={Icon.boardWarning}></img>
        return video
      })
      this.setState({
        rVideos: _rVideos
      })
    })

    //강사는 유저의 요청을 처리한 다음에 화면을 어떻게 출력함
    getSocket().on("alert-host-process-req-question", data => {
      const { filterRemote } = this.state;
      const { remoteSocketId, type } = data;
      const { req_status, timestamp } = data.data;
      if(Number(req_status)){
        const time = moment().format('DD/MM/YYYYHH:mm:ss')
        const { userInfo } = data.data
        //요청한 유저의 Video를 수정
        let _rVideos = filterRemote.map(rVideo => {
          const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === "video")
          const req_question_status = rVideo.name === remoteSocketId ? Number(req_status) : false;
          let video = _videoTrack ? (
              <VideoItem 
                rVideo={rVideo}
                userInfo={userInfo}
                req_question_status={req_question_status}
                time={time}
                type="request_question"
              />
          ) : <img src={Icon.boardWarning}></img>
          return video
        })
        this.setState({
          rVideos: _rVideos
        })
      }
    })

    getSocket().on("alert-host-process-req-lecOut", data => {
      const { filterRemote } = this.state;
      const { remoteSocketId, type } = data;
      const { req_status, timestamp } = data.data;
      if(Number(req_status)){
        const time = moment().format('DD/MM/YYYYHH:mm:ss')
        const { userInfo } = data.data
        //요청한 유저의 Video를 수정
        let _rVideos = filterRemote.map(rVideo => {
          const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === "video")
          const req_lecOut_status = rVideo.name === remoteSocketId ? Number(req_status) : false;
          let video = _videoTrack ? (
              <VideoItem 
                rVideo={rVideo}
                userInfo={userInfo}
                req_lecOut_status={req_lecOut_status}
                time={time}
                type="request_lecOut"
              />
          ) : <img src={Icon.boardWarning}></img>
          return video
        })
        this.setState({
          rVideos: _rVideos
        })
      }
    })

    const UserRoomId = () => {
      return JSON.parse(window.localStorage.getItem("usr_id"))
    }
    const fetchData = async () => {
      let params = {
        userroom_id: UserRoomId()
      }
      const resp = await getLectureInfo(params)
      this.props.dispatch(remoteStreamContainerAction.saveLectureInfo(resp))
      const { test_gap_time } = resp.data
      intervalTime = setInterval(() => {
        var min = 1,
          max = 8;
        var rand = Math.floor(Math.random() * (max - min + 1) + min);
        let payload = {
          number: rand
        }
        remoteStreamContainer.emitTestConcentration(payload)
      }, 1000 * 60 * Number(test_gap_time));
    }
    fetchData()
    if (this.props.remoteStreams.length !== 0) {
      const { remoteStreams } = this.props
      const fetchVideos = async () => {
        const { rVideos, filterRemote } = await SetVideos(remoteStreams, this.props)
        this.setState({
          rVideos: rVideos,
          filterRemote: filterRemote,
          loading: false
        })
      }
      fetchVideos();
    }
  }
  componentWillUnmount(){
    clearInterval(intervalTime)
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.remoteStreams !== nextProps.remoteStreams ||
      this.props.paintScream !== nextProps.paintScream
    ) {
      const fetchVideos = async () => {
        const { rVideos, filterRemote } = await SetVideos(nextProps.remoteStreams, this.props)
        this.setState({
          rVideos: rVideos,
          filterRemote: filterRemote,
          loading: false
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
  handleResize = () => {
    this.setState({resize: !this.state.resize})
  };

  render() {

    const { loading } = this.state
    if (loading) {
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
const VideoItem = ({rVideo, userInfo, request, type ,time, req_question_status, req_lecOut_status}) => {
  const[req, setReq] = useState()
  const[reqQuestionStatus, setReqQuestionStaus] = useState()
  //!체크필요함
  useEffect(() => {
    setReqQuestionStaus(req_question_status)
    setReq(request)
  }, [time])
  // useEffect(() => {
    
  //   setReq(request)
  // },[])

  const handleClickWarning = (socketId) => {
    console.log(socketId)
  }

  const handleDisableChatting = (socketId) => {

  }
  const UserRoomId = () => {
    return JSON.parse(window.localStorage.getItem("usr_id"))
  }
  
  //!정보를 저장할필요함
  const handleClickReject = () => {
    setReq(false)
    const payload = {
      type: type,
      status: "reject",
      userId: userInfo.user_idx,
      userRoomId: UserRoomId(),
      remoteSocketId: rVideo.id
    }
    remoteStreamContainer.emitProcessRequestUser(payload)
  }

  const handleClickAccept = () => {
    setReq(false)
    const payload = {
      type: type,
      status: "accept",
      userId: userInfo.user_idx,
      userRoomId: UserRoomId(),
      remoteSocketId: rVideo.id
    }
    remoteStreamContainer.emitProcessRequestUser(payload)
  }

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
          userInfo={userInfo}
          socketId={rVideo.id}
          //handleClickWarning={() => handleClickWarning(rVideo.name)}
          //handleDisableChatting={() => handleDisableChatting(rVideo.name)}
        />
      </div>
      {
        req &&
        <div className="wrapper-request">
          <WrapperUserRequest
            type={type}
            userInfo={userInfo}
            handleClickAccept={() => handleClickAccept()}
            handleClickReject={() => handleClickReject()}
          />
        </div>
      }
      {
        req_question_status && 
        <div className="wrapper-request">
          질문 요청중...
        </div>
      }
      {
        req_lecOut_status && 
        <div className="wrapper-request">
          자리비움 요청중...
        </div>
      }
    </div>
  )
}

const  SetVideos = (remoteStreams, props) => {
  // const dispatch = useDispatch();

  return new Promise((resolve, rej) => {
    //!두개 값을 이렇게 하면 될것같음
    let usr_id = localStorage.getItem("usr_id") 
    let data = window.localStorage.getItem("asauth")
    let { userId } = JSON.parse(data).userInfoToken
    let params = { usr_id, userId }


    getInformationRoom(params).then(res => {
      const { data } = res
      //!여기서 유저인지 강사인지 구분해야됨
      const listUser = data.slice(1, data.length)
      props.dispatch(remoteStreamContainerAction.saveListUser(listUser))
      
      let _filterRemote = remoteStreams.filter(rVideo => listUser.find(({ socket_id }) => rVideo.id === socket_id) && rVideo)
      let _rVideos = _filterRemote.map((rVideo, index) => {
        const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === "video")
        let [infoStreamBySocketId] = listUser.filter(element => element.socket_id === rVideo.name)
        let video = _videoTrack ? (
          <VideoItem 
            rVideo={rVideo}
            userInfo={infoStreamBySocketId}
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

const WrapperUserRequest = ({ type, userInfo, handleClickAccept, handleClickReject }) => {
  type = type === "request_question" ? "음성질문" : "자리비움";

  return (
    <div>
      <p className="wrapper-request__name">{userInfo.user_name}</p>
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
const WrapperTaskVideo = ({ userInfo, socketId }) => {
  const handleClickWarning = () => {
    let usr_id = localStorage.getItem("usr_id") 
    let payload = {
      userId: userInfo.user_idx,
      remoteSocketId: socketId,
      userRoomId: usr_id
    }
    remoteStreamContainer.emitHostWarning(payload)
  }
  const handleDisableChatting = () => {
    let payload = {
      remoteSocketId: socketId,
      userId: userInfo.user_idx
    }
    chatComponentSocket.emitDisableUserChat(payload)
  }
  return (
    <div>
      <h1>{userInfo.user_name}</h1>
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
const mapStateToProps = state => ({
  listUser: remoteStreamSelector.getListUser(state)
})


function mapDispatchToProps(dispatch) {
  let actions = bindActionCreators({ RemoteStreamContainer });
  return { ...actions, dispatch };
}

const WrapperLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`
export default connect(mapStateToProps, mapDispatchToProps)(RemoteStreamContainer);
// export default 