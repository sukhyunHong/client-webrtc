import React, { Component } from 'react';

class Video extends Component {
  constructor(props) {
    super(props)
    this.state = {
      mic: false,
      camera: true,
      // currentStream: new MediaStream(),
      // videoTrack: false,
      videoVisible: true,
    }
  }

  componentDidMount() {
    if (this.props.videoStream) {
      this.video.srcObject = this.props.videoStream
    }
  }

  componentWillReceiveProps(nextProps) {

    // This is done only once
    if (nextProps.videoStream && nextProps.videoStream !== this.props.videoStream) {
      // if (!this.props.videoStream) {
        this.video.srcObject = nextProps.videoStream
    }
      
    if(this.props.localMicMute !== nextProps.localMicMute){
      this.mutemic()
    }  

    if(this.props.localVideoMute !== nextProps.localVideoMute){
      this.mutecamera()
    } 

    // This is done only once when we receive a video track
    const videoTrack = nextProps.videoStream && nextProps.videoStream.getVideoTracks()
    if (this.props.videoType === 'remoteVideo' && videoTrack && videoTrack.length) {
      
      videoTrack[0].onmute = () => {
        // alert('muted')
        this.setState({
          videoVisible: false,
        })
        this.props.videoMuted(nextProps.videoStream)
      }

      videoTrack[0].onunmute = () => {
        this.setState({
          videoVisible: true,
        })
        this.props.videoMuted(nextProps.videoStream)
      }
    }

    const audioTrack = nextProps.videoStream && nextProps.videoStream.getAudioTracks()
    if (this.props.videoType === 'remoteVideo' && audioTrack && audioTrack.length) {
      audioTrack[0].onmute = () => {
        // this.setState({
        //   videoVisible: false,
        // })
        // this.props.videoMuted(nextProps.videoStream)
      }
    }

  }

  mutemic = (e) => {
    const stream = this.video.srcObject.getTracks().filter(track => track.kind === 'audio')
    console.log(stream[0].enabled )
    this.setState(prevState => {
      if (stream) stream[0].enabled = !prevState.mic
      return {mic: !prevState.mic}
    })
  }

  mutecamera = (e) => {
    const stream = this.video.srcObject.getTracks().filter(track => track.kind === 'video')
    this.setState(prevState => {
      if (stream) stream[0].enabled = !prevState.camera
      return {camera: !prevState.camera}
    })
  }
  render() {
    return (
        <video
          id={this.props.id}
          muted={this.props.muted}
          autoPlay
          style={{
            visibility: this.state.videoVisible && 'visible' || 'hidden',
            ...this.props.videoStyles,
          }}
          ref={ (ref) => {this.video = ref }}
        >
        </video>
    )
  }
}

export default Video