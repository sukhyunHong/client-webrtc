import React, { Component, useEffect, useState } from 'react'
import Video from '../Video'
import qs from 'query-string'
import Axios from 'axios'
import ReactLoading from "react-loading";
import styled from 'styled-components'
import moment from 'moment';
import CountTime from '../../../../components/CountTime';
import './style.scss'
class LeftContentContainer extends Component {
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
  componentDidMount(){
    if(this.props.remoteStreams.length !== 0){
      const { remoteStreams, requestUser } = this.props
      let roomname = qs.parse(window.location.search).room
      let username = qs.parse(window.location.search).user

      //n명에 있는 경우에는 점에 사람이 있는 경우에는
      Axios({
        method: 'get',
        url: `${process.env.REACT_APP_SERVER_API}/room/gethostroom`,
        params: {
          roomname, username
        }
      }).then(res => {
        let selectedVideo = {}
        let hostSocketId;
        const { data } = res;
        hostSocketId = data.data;
        selectedVideo = this.state.selectedVideo && remoteStreams.remoteStreams.filter(stream => stream.id === hostSocketId) || [];
        selectedVideo = selectedVideo.length ? selectedVideo[0] : [];
        let _rVideos = remoteStreams.map((rVideo, index) => {
          const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === 'video')   
          const requestValue = requestUser.filter(element => element.remoteId === rVideo.name)
          let video = _videoTrack && (
            <div className="video-item">
              <Video
                videoMuted={this.videoMuted}
                videoType='remoteVideo'
                videoStream={rVideo.stream}
                videoStyles={{
                  // objectFit: 'cover',
                  // borderRadius: 5,
                  // width: 250, height: 220,
                  // maxWidth: 250, maxHeight: 200,
                }}
              />
              {
                requestValue.length === 1 ? 
                  //자리 비움 요청
                  requestValue[0].type === 'out' ?
                      requestValue[0].state ?
                        <div className="wrapper-request">
                          <div>
                            <p className="wrapper-request__name">홍길동</p>
                            <CountTime />
                          </div>
                        </div> :
                        <div className="wrapper-request">
                          <div>
                            <p className="wrapper-request__name">홍길동</p>
                            <p className="wrapper-request__type"><span>자리비움</span> 요청</p> 
                            <div className="wrapper-request__btn">
                              <button className="wrapper-request__btn--reject" onClick={() => this.props.handleActionRequestUser(rVideo.name, "reject", requestValue[0].type)}>거절</button>
                              <button className="wrapper-request__btn--accept" onClick={() => this.props.handleActionRequestUser(rVideo.name, "accept", requestValue[0].type)}>수락</button>
                            </div>
                          </div>
                        </div>
                      :

                    //질문 요청
                      requestValue[0].state ?
                        <div className="wrapper-request">
                          <div>
                            <p className="wrapper-request__name">홍길동</p>
                            <p><i className="material-icons" >mic</i></p>
                          </div>
                        </div> :
                        <div className="wrapper-request">
                          <div>
                            <p className="wrapper-request__name">홍길동</p>
                            <p className="wrapper-request__type"><span>질문</span> 요청</p> 
                            <div className="wrapper-request__btn">
                              <button className="wrapper-request__btn--reject" onClick={() => this.props.handleActionRequestUser(rVideo.name, "reject", requestValue[0].type)}>거절</button>
                              <button className="wrapper-request__btn--accept" onClick={() => this.props.handleActionRequestUser(rVideo.name, "accept", requestValue[0].type)}>수락</button>
                            </div>
                          </div>
                        </div> :
                    ""
              }
            </div>
          ) || <div></div>

          return (
            video
          )
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
      this.props.paintScream !== nextProps.paintScream )
    {

      const NoOfRemoteStreams = nextProps.remoteStreams.length

      let selectedVideo = {}

      let roomname = qs.parse(window.location.search).room
      let username = qs.parse(window.location.search).user


      let hostSocketId
      //n명에 있는 경우에는 점에 사람이 있는 경우에는
      Axios({
        method: 'get',
        url: `${process.env.REACT_APP_SERVER_API}/room/gethostroom`,
        params: {
          roomname, username
        }
      }).then(res => {
        const { data } = res;
        hostSocketId = data.data;
        //2명
        if (NoOfRemoteStreams === 1)
          selectedVideo = { selectedVideo: nextProps.remoteStreams[0] }
        else {
          selectedVideo = this.state.selectedVideo && nextProps.remoteStreams.filter(stream => stream.id === hostSocketId) || []
          selectedVideo = selectedVideo.length ? selectedVideo[0] : { selectedVideo: nextProps.remoteStreams[NoOfRemoteStreams - 1] }
        }
        let _rVideos = nextProps.remoteStreams.map((rVideo, index) => {
          const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === 'video')   
          const requestValue = nextProps.requestUser.filter(element => element.remoteId === rVideo.name)
          let video = _videoTrack && (
            <div className="video-item">
              <Video
                muted={true}
                videoMuted={this.videoMuted}
                videoType='remoteVideo'
                videoStream={rVideo.stream}
                videoStyles={{
                  // objectFit: 'cover',
                  // borderRadius: 5,
                  // width: 250, height: 220,
                  // maxWidth: 250, maxHeight: 200,
                }}
              />
              <div className="btn-wrapper" style={requestValue.length === 1 ? {display: 'none'} : {}}>
                <div>
                  <h1>홍길동</h1>
                  <div className="btn-list">
                    <button onClick = {() => this.props.handleUserWarning(rVideo.name, "warning", "warning")}>경고</button>
                    <button onClick = {() => this.props.handleDisconnectToUser(rVideo.name, "disconnect")}>강퇴</button>
                    <button onClick = {() => this.props.handleDisableChattingToUser(rVideo.name, "disable_chatting", "disable_chatting")}>채팅금지</button>
                  </div>
                </div>
              </div>
              {
                requestValue.length === 1 ? 
                  //자리 비움 요청
                  requestValue[0].type === 'out' ?
                      requestValue[0].state ?
                        <div className="wrapper-request">
                          <div>
                            <p className="wrapper-request__name">홍길동</p>
                            <CountTime />
                          </div>
                        </div> :
                        <div className="wrapper-request">
                          <div>
                            <p className="wrapper-request__name">홍길동</p>
                            <p className="wrapper-request__type"><span>자리비움</span> 요청</p> 
                            <div className="wrapper-request__btn">
                              <button className="wrapper-request__btn--reject" onClick={() => this.props.handleActionRequestUser(rVideo.name, "reject", requestValue[0].type)}>거절</button>
                              <button className="wrapper-request__btn--accept" onClick={() => this.props.handleActionRequestUser(rVideo.name, "accept", requestValue[0].type)}>수락</button>
                            </div>
                          </div>
                        </div>
                      :

                    //질문 요청
                      requestValue[0].state ?
                        <div className="wrapper-request">
                          <div>
                            <p className="wrapper-request__name">홍길동</p>
                            <p><i className="material-icons" >mic</i></p>
                            <div className="wrapper-request__btn">
                              <button className="wrapper-request__btn--end" onClick={() => this.props.handleActionRequestUser(rVideo.name, "reject", requestValue[0].type)}>질문 요청 완료</button>
                            </div>
                          </div>
                        </div> :
                        <div className="wrapper-request">
                          <div>
                            <p className="wrapper-request__name">홍길동</p>
                            <p className="wrapper-request__type"><span>질문</span> 요청</p> 
                            <div className="wrapper-request__btn">
                              <button className="wrapper-request__btn--reject" onClick={() => this.props.handleActionRequestUser(rVideo.name, "reject", requestValue[0].type)}>거절</button>
                              <button className="wrapper-request__btn--accept" onClick={() => this.props.handleActionRequestUser(rVideo.name, "accept", requestValue[0].type)}>수락</button>
                            </div>
                          </div>
                        </div> :
                    ""
              }
            </div>
          ) || <div></div>

          return (
            video
            // <div
            //   id={rVideo.name}
            //   onClick={() => this.switchVideo(rVideo)}
            //   style={{
            //     cursor: 'pointer', display: 'inline-block'
            //   }}
            //   key={index}
            // >
            //   {video}
            // </div>
          )
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

  videoMuted = (rVideo) => {
    const muteTrack = rVideo.getVideoTracks()[0]
    const isSelectedVideo = rVideo.id === this.state.selectedVideo.stream.id
    if (isSelectedVideo) {
      this.setState({
        videoVisible: !muteTrack.muted
      })
    }
  }

  switchVideo = (_video) => {
    const muteTrack = _video.stream.getVideoTracks()[0]
    this.setState({
      selectedVideo: _video,
      videoVisible: !muteTrack.muted
    })
  }

  render() {
    const { loading } = this.state;
    if(!loading)
    {
      return <WrapperLoading className="loading">
            <ReactLoading type="spin" color="#000" />
        </WrapperLoading>
    }
    return (
      <div className="left-content__container">
        {
          this.props.isMainRoom ?
            <div className="list-videos">
              <div className={`video-${this.state.remoteStreams.length}`}>
                { this.state.rVideos }
              </div>
            </div> 
            :
            //학생인 경우애는 
            <div className="single-video">
                <div className="single-video__body">
                  <Video
                      videoType="previewVideo"
                      videoStyles={{
                        width: "100%",
                        height: "100%",
                        visibility: "visible",
                        objectFit: "initial",
                      }}
                      muted={true}
                      videoStream={
                        this.state.selectedVideo && this.state.selectedVideo.stream
                      }
                      />
                      {
                        this.props.outEnable &&
                        <div className="wrapper-outState">
                          <div>
                            <h3>홍길동</h3>
                            <CountTime/>
                            <button onClick={() => this.props.handleCancelOut()}>복귀하기</button> 
                          </div>
                        </div>
                      }
                  </div>
                  <div className="single-video__footer">
                    <i className="material-icons" onClick={() => this.props.handleUserOutRoom() }>
                      input
                    </i>
                    <div>
                      <button onClick={() => this.props.handleRequestQuestion()} >음성 질문 요청</button>
                      <button onClick={() => this.props.handleRequestGoOut()} >자리 비움 요청</button>
                    </div>
                    <span>수학 - 제1강 집합</span>
                  </div>
            </div>
        }
      </div>
    );
  }
}

const WrapperLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`

export default LeftContentContainer
