import React, { Component } from 'react'
import Video from '../Video'
import qs from 'query-string'
import Axios from 'axios'
import './style.scss'
class LeftContentContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      rVideos: [],
      remoteStreams: [],

      
      selectedVideo: null,
      videoVisible: false,
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.remoteStreams !== nextProps.remoteStreams || this.props.requestUser !== nextProps.requestUser) {
      const NoOfRemoteStreams = nextProps.remoteStreams.length
      console.log(nextProps.requestUser)

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
        hostSocketId = data.data
        //!안됨
        //2명
        if (NoOfRemoteStreams === 1)
          selectedVideo = { selectedVideo: nextProps.remoteStreams[0] }
        else {
          selectedVideo = this.state.selectedVideo && nextProps.remoteStreams.filter(stream => stream.id === hostSocketId) || []
          selectedVideo = selectedVideo.length ? selectedVideo[0] : { selectedVideo: nextProps.remoteStreams[NoOfRemoteStreams - 1] }
        }

        let _rVideos = nextProps.remoteStreams.map((rVideo, index) => {
          const _videoTrack = rVideo.stream.getTracks().filter(track => track.kind === 'video')   
          const check = nextProps.requestUser.includes(rVideo.name)
          console.log(check)
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

  handleRequestQuestion = () =>{
    this.props.handleRequestQuestion();
  }

  handleRequestGoOut = () => {
    this.props.handleRequestGoOut();
  }
  render() {
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
                      videoStream={
                        this.state.selectedVideo && this.state.selectedVideo.stream
                      }
                      />
                  </div>
                  <div className="single-video__footer">
                    <i className="material-icons" onClick={() => {
                        // this.setState({
                        //   disconnected: true,
                        // });
                        this.props.history.push("/meetting");
                      }}
                    >
                      input
                    </i>
                    <div>
                      <button onClick={() => this.handleRequestQuestion()} >음성 질문 요청</button>
                      <button onClick={() => this.handleRequestGoOut()} >자리 비율 요청</button>
                    </div>
                    <span>수학 - 제1강 집합</span>
                  </div>
            </div>
        }
      </div>
    );
  }

}

export default LeftContentContainer
