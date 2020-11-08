import React, { Component } from 'react'
import Video from '../Video'
import qs from 'query-string'
import Axios from 'axios'
class Videos extends Component {
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
    if (this.props.remoteStreams !== nextProps.remoteStreams) {

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
          // if (_videoTrack.length)
          //   _videoTrack[0].onmute = () => {
          //     alert('muted')
          //   }
          let video = _videoTrack && (
            <Video
              videoMuted={this.videoMuted}
              videoType='remoteVideo'
              videoStream={rVideo.stream}
              frameStyle={{
                backgroundColor: '#ffffff12',
                maxWidth: 250, maxHeight: 220,
                borderRadius: 5,
                float: 'left', margin: '0 3px'
              }}
              videoStyles={{
                objectFit: 'cover',
                borderRadius: 5,
                width: 250, height: 220,
                maxWidth: 250, maxHeight: 200,
              }}
            />
          ) || <div></div>

          return (
            <div
              id={rVideo.name}
              onClick={() => this.switchVideo(rVideo)}
              style={{
                cursor: 'pointer', display: 'inline-block'
              }}
              key={index}
            >
              {video}
            </div>
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
    alert('aa')
  }

  handleRequestGoOut = () => {
    alert("aa")
  }
  render() {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
        }}
      >
        {/* <Video
          videoType="previewVideo"
          // frameStyle={{
          //   zIndex: 1,
          //   position: 'fixed',
          //   bottom: 0,
          //   minWidth: '100%', minHeight: '100%',
          //   backgroundColor: 'black'
          // }}
          videoStyles={{
            minWidth: "70%",
            minHeight: "70%",
            // visibility: (this.state.videoVisible && "visible") || "hidden",
            visibility: "visible",
          }}
          videoStream={
            this.state.selectedVideo && this.state.selectedVideo.stream
          }
        /> */}
        {this.state.rVideos.length !== 0 && (
          <div
          // style={{
          //   zIndex: 3,
          //   // position: 'fixed',
          //   padding: '6px 3px',
          //   backgroundColor: 'rgba(0,0,0,0.3)',
          //   maxHeight: 120,
          //   top: 'auto',
          //   right: 10,
          //   left: 10,
          //   bottom: 10,
          //   // overflowX: 'scroll',
          //   whiteSpace: 'nowrap'
          // }}
          >
            {
              this.props.isMainRoom ? this.state.rVideos :
                <>
                  <Video
                    videoType="previewVideo"
                    // frameStyle={{
                    //   zIndex: 1,
                    //   position: 'fixed',
                    //   bottom: 0,
                    //   minWidth: '100%', minHeight: '100%',
                    //   backgroundColor: 'black'
                    // }}
                    videoStyles={{
                      minWidth: "70%",
                      minHeight: "70%",
                      // visibility: (this.state.videoVisible && "visible") || "hidden",
                      visibility: "visible",
                    }}
                    videoStream={
                      this.state.selectedVideo && this.state.selectedVideo.stream
                    }
                  />
                  <div style={{
                    textAlign: 'center',
                    background: 'black',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignContent: 'center',
                    padding: '0 30px'
                  }}>
                    <i
                      style={{
                        cursor: "pointer",
                        outline: "none",
                        padding: 15,
                        fontSize: 25,
                        color: "white" || "red",
                        transform: "rotate(180deg)",
                      }}
                      className="material-icons"
                      onClick={() => {
                        // this.setState({
                        //   disconnected: true,
                        // });
                        this.props.history.push("/meetting");
                      }}
                    >
                      input{" "}
                    </i>
                    <div>
                    <button onClick={() => this.handleRequestQuestion()} style={{padding: '10px'}}>음성 질문 요청</button>
                    <button onClick={() => this.handleRequestGoOut()} style={{padding: '10px'}}>자리 비움 요청</button>
                    </div>
                    <p>수학</p>
                  </div>
                </>
            }
          </div>
        )}
      </div>
    );
  }

}

export default Videos
