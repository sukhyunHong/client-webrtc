import React, { Component } from 'react'
import { bindActionCreators } from "redux"
import { connect } from 'react-redux'


import "./style.scss"
import Alert from "../../components/Alert"
import getSocket from "../rootSocket"
import meetingRoomSocket from './MeetingRoom.Socket'
import meetingRoomAction from "./MeetingRoom.Action"

//import component
import HeadingController from './components/HeadingController'
import RemoteStreamContainer from './components/RemoteStreamContainer'
import RemoteStreamContainerStudent from './components/RemoteStreamContainerStudent'
import LocalStreamComponent from './components/LocalStreamComponent'
import ChatComponent from './components/ChatComponent'
import WhiteBoard from './components/WhiteBoard'

import moment from 'moment'
import HeadingControllerStudent from './components/HeadingControllerStudent'
console.log(getSocket())
console.log(getSocket().connected)
console.log(getSocket().disconnected)
console.log(getSocket().query)
class MeetingRoom extends Component {
  constructor(props) {
    super(props)

    this.videoRef = React.createRef()

    this.state = {
      localStream: null,
      remoteStream: null, //! 필요없는 것같음

      remoteStreams: [],
      peerConnections: {},

      mediaRecorder: null,
      selectedVideo: null,

      pc_config: {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302"
          }
        ]
      },

      sdpConstraints: {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
        }
      },

      isMainRoom: false,

      sendChannels: [],
      requestUser: [],
      recordedBlobs: [],
      disconnected: false,

      fullScream: false,
      paintScream: false,
      enableRecord: false

    }
  }

  //로컬의 Stream는 출력함
  //!기계를 체크할 필요함
  getLocalStream = () => {
    const constraints = {
      audio: false,
      video: true,
      options: {
        mirror: true
      }
    }

    const handleSuccess = stream => {
      const video = document.querySelector("video")
      const videoTracks = stream.getVideoTracks()
      console.log(`Using video device: ${videoTracks[0].label}`)

      this.setState({
        localStream: stream
      })
      // this.whoisOnline()
      // this.props.dispatch(meetingRoomAction.doCreateLocalStream(stream))
      this.props.dispatch(meetingRoomAction.whoisOnline())
      window.stream = stream 
      video.srcObject = stream
    }

    const handleError = error => {
      if (error.name === "ConstraintNotSatisfiedError") {
        const v = constraints.video
        console.log(
          `The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`
        )
      } else if (error.name === "PermissionDeniedError") {
        console.log(
          "Permissions have not been granted to use your camera and " +
            "microphone, you need to allow the page access to your devices in " +
            "order for the demo to work."
        )
      }
      console.log(`getUserMedia error: ${error.name}`, error)
    }

    async function init(e) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        handleSuccess(stream)
      } catch (e) {
        handleError(e)
      }
    }
    init()
  }
  createPeerConnection = (socketID, callback) => {
    try {
      let pc = new RTCPeerConnection(this.state.pc_config)
      console.log("craste perrr", socketID)
      // add pc to peerConnections object
      const peerConnections = {
        ...this.state.peerConnections,
        [socketID]: pc
      }
      this.setState({
        peerConnections
      })

      pc.onicecandidate = e => {
        if (e.candidate) {
          meetingRoomSocket.sendToPeer("candidate", e.candidate, {
            local: getSocket().id,
            remote: socketID
          })
          // this.sendToPeer("candidate", e.candidate, {
          //   local: this.socket.id,
          //   remote: socketID
          // })
        }
      }

      pc.oniceconnectionstatechange = e => {}

      pc.ontrack = e => {
        let _remoteStream = null
        let remoteStreams = this.state.remoteStreams
        let remoteVideo = {}

        // 1. check if stream already exists in remoteStreams
        const rVideos = this.state.remoteStreams.filter(
          stream => stream.id === socketID
        )
        // 2. if it does exist then add track
        if (rVideos.length) {
          _remoteStream = rVideos[0].stream
          _remoteStream.addTrack(e.track, _remoteStream)

          remoteVideo = {
            ...rVideos[0],
            stream: _remoteStream
            // isHost: this.state.isMainRoom
          }
          remoteStreams = this.state.remoteStreams.map(_remoteVideo => {
            return (
              (_remoteVideo.id === remoteVideo.id && remoteVideo) ||
              _remoteVideo
            )
          })
        } else {
          // 3. if not, then create new stream and add track
          _remoteStream = new MediaStream()
          _remoteStream.addTrack(e.track, _remoteStream)

          remoteVideo = {
            id: socketID,
            name: socketID,
            stream: _remoteStream
            // isHost: this.state.isMainRoom
          }
          remoteStreams = [...this.state.remoteStreams, remoteVideo]
        }

        this.setState(prevState => {
          // If we already have a stream in display let it stay the same, otherwise use the latest stream
          // const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: e.streams[0] }
          const remoteStream =
            prevState.remoteStreams.length > 0
              ? {}
              : {
                  remoteStream: _remoteStream
                }

          let selectedVideo = prevState.remoteStreams[0]
            ? prevState.remoteStreams[0]
            : []

          // if the video is still in the list, then do nothing, otherwise set to new video stream
          selectedVideo = selectedVideo.length
            ? {}
            : {
                selectedVideo: remoteVideo
              }

          return {
            ...selectedVideo,
            ...remoteStream,
            remoteStreams
          }
        })
      }
      pc.close = () => {
        // alert('GONE')
        console.log("pc closed")
      }

      if (this.state.localStream)
        // pc.addStream(this.state.localStream)
        this.state.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.state.localStream)
        })
      // return pc
      callback(pc)
    } catch (e) {
      console.log("Something went wrong! pc not created!!", e)
      // return;
      callback(null)
    }
  }

  componentDidMount(){
    window.onunload = window.onbeforeunload = function () {
      getSocket.close()
    }

    //! Redux 저장할 필요없나?
    /************** Peer connect */
    getSocket().on("connection-success", data => {
      console.log("connetion-sucess", data)
      this.getLocalStream()
      const { isHost } = data

      //집중도 테스트함
      let intervalTime = ""

      //default 1분
      if (isHost) {
        const time = localStorage.getItem("time")
          ? localStorage.getItem("time")
          : 1
        intervalTime = setInterval(() => {
          var min = 0,
            max = 10
          var rand = Math.floor(Math.random() * (max - min + 1) + min)
          meetingRoomSocket.sendToPeer(
            "test-concentration",
            {
              number: rand
            },
            null
          )
        }, 1000 * Number(time) * 60)
      }

      this.setState({
        // status: status,
        isMainRoom: isHost,
        timeTestConcentrationAPI: intervalTime,
        messages: data.messages,
        localMicMute: isHost ? false : true
      })
    })

    // getSocket().on("joined-peers", data => {
    //   this.setState({
    //     status:
    //       data.peerCount > 1
    //         ? `Room : ${room}: ${data.peerCount}`
    //         : "기다리는 중.."
    //   })
    // })

    getSocket().on("peer-disconnected", data => {
      try {
        // close peer-connection with this peer
        this.state.peerConnections[data.socketID].close()

        // get and stop remote audio and video tracks of the disconnected peer
        const rVideo = this.state.remoteStreams.filter(
          stream => stream.id === data.socketID
        )
        rVideo && this.stopTracks(rVideo[0].stream)

        // filter out the disconnected peer stream
        const remoteStreams = this.state.remoteStreams.filter(
          stream => stream.id !== data.socketID
        )
        this.setState(prevState => {
          // check if disconnected peer is the selected video and if there still connected peers, then select the first
          const selectedVideo =
            prevState.selectedVideo.id === data.socketID && remoteStreams.length
              ? {
                  selectedVideo: remoteStreams[0]
                }
              : null

          return {
            // remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
            remoteStreams,
            ...selectedVideo,
          }
        })
      } catch (error) {
        console.log(error)
      }
    })

    getSocket().on("online-peer", socketID => {
      console.log('connected peers ...', socketID)

      // create and send offer to the peer (data.socketID)
      // 1. Create new pc
      this.createPeerConnection(socketID, pc => {
        // 2. Create Offer
        if (pc) {
          // Send Channel
          const handleSendChannelStatusChange = event => {}

          const sendChannel = pc.createDataChannel("sendChannel")
          sendChannel.onopen = handleSendChannelStatusChange
          sendChannel.onclose = handleSendChannelStatusChange

          this.setState(prevState => {
            return {
              sendChannels: [...prevState.sendChannels, sendChannel]
            }
          })

          // Receive Channels
          const handleReceiveMessage = event => {
            const message = JSON.parse(event.data)
            console.log("handleReceiveMessage", message)
            this.setState(prevState => {
              return {
                messages: [...prevState.messages, message]
              }
            })
          }

          const handleReceiveChannelStatusChange = event => {
            if (this.receiveChannel) {
              console.log(
                "receive channel's status has changed to " +
                  this.receiveChannel.readyState
              )
            }
          }

          //online peer
          const receiveChannelCallback = event => {
            const receiveChannel = event.channel
            receiveChannel.onmessage = handleReceiveMessage
            receiveChannel.onopen = handleReceiveChannelStatusChange
            receiveChannel.onclose = handleReceiveChannelStatusChange
          }

          pc.ondatachannel = receiveChannelCallback

          pc.createOffer(this.state.sdpConstraints).then(sdp => {
            pc.setLocalDescription(sdp)
            meetingRoomSocket.sendToPeer("offer", sdp, {
              local: getSocket().id,
              remote: socketID
            })
          })
        }
      })
    })

    getSocket().on("offer", data => {

      console.log("offer")
      this.createPeerConnection(data.socketID, pc => {
        pc.addStream(this.state.localStream)

        // Send Channel
        const handleSendChannelStatusChange = event => {
          // console.log('send channel status: ' + this.state.sendChannels[0].readyState)
        }

        const sendChannel = pc.createDataChannel("sendChannel")
        sendChannel.onopen = handleSendChannelStatusChange
        sendChannel.onclose = handleSendChannelStatusChange

        this.setState(prevState => {
          return {
            sendChannels: [...prevState.sendChannels, sendChannel]
          }
        })

        // Receive Channels
        const handleReceiveMessage = event => {
          const message = JSON.parse(event.data)
          this.setState(prevState => {
            return {
              messages: [...prevState.messages, message]
            }
          })
        }

        const handleReceiveChannelStatusChange = event => {
          if (this.receiveChannel) {
            console.log(
              "receive channel's status has changed to " +
                this.receiveChannel.readyState
            )
          }
        }

        const receiveChannelCallback = event => {
          const receiveChannel = event.channel
          receiveChannel.onmessage = handleReceiveMessage
          receiveChannel.onopen = handleReceiveChannelStatusChange
          receiveChannel.onclose = handleReceiveChannelStatusChange
        }

        pc.ondatachannel = receiveChannelCallback

        pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(
          () => {
            // 2. Create Answer
            pc.createAnswer(this.state.sdpConstraints).then(sdp => {
              pc.setLocalDescription(sdp)
              console.log("send answer")
              meetingRoomSocket.sendToPeer("answer", sdp, {
                local: getSocket().id,
                remote: data.socketID
              })
            })
          }
        )
      })
    })
    getSocket().on("answer", data => {
      console.log("answer")
      const pc = this.state.peerConnections[data.socketID]
      pc.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      ).then(() => {})
    })
    getSocket().on("candidate", data => {
      const pc = this.state.peerConnections[data.socketID]
      if (pc) pc.addIceCandidate(new RTCIceCandidate(data.candidate))
    })
    /************** Peer connect - end */

    // //redux에다가 저장할 필요없는 socket.on 이벤트
    // getSocket().on("alert-host-question", data => {
    //   const { remoteSocketId, remoteUsername } = data
    //   let value = {
    //     type: "request-question",
    //     remoteId: remoteSocketId,
    //     state: false,
    //     remoteUsername: remoteUsername
    //   }
    //   this.setState({
    //     requestUser: [...this.state.requestUser, value]
    //   })
    // })
    // getSocket().on("alert-host-lecOut", data => {
    //   const { remoteSocketId, remoteUserName } = data
    //   let value = {
    //     type: "request-lecOut",
    //     remoteId: remoteSocketId,
    //     state: false,
    //     remoteUserName: remoteUserName
    //   }
    //   this.setState({
    //     requestUser: [...this.state.requestUser, value]
    //   })
    // })

  }
  handleOutRoom = () => {
    const { remoteStreams } = this.state
    if (remoteStreams.length !== 0) {
      Alert({
        title: "수업을 종료하시겠습니까?",
        content: `핵생이 남아있는 경우, 모도 퇴장됩니다.`,
        handleClickAccept: () => {
          this.setState({
            disconnected: true
          })
        },
        handleClickReject: () => {} 
      })
    } else {
      Alert({
        title: "수업을 종료하시겠습니까?",
        handleClickAccept: () => {
          this.setState({
            disconnected: true
          })
        },
        handleClickReject: () => {} 
      })
    }
  }
  handleWindowSize = () => {
    this.setState({
      fullScream: !this.state.fullScream
    })
  }
  handleScreenMode = () => {
    try {
      navigator.mediaDevices
        .getDisplayMedia({
          video: {
            cursor: "always"
          },
          audio: true
        })
        .then(stream => {
          this.setState({
            localStreamTemp: this.state.localStream,
            localStream: stream
          })

          const { peerConnections, shareScream } = this.state
          let videoTrack = stream.getVideoTracks()[0]
          Object.values(peerConnections).forEach(pc => {
            var sender = pc.getSenders().find(function (s) {
              return s.track.kind === videoTrack.kind
            })
            this.setState({
              shareScream: !shareScream
            })
            sender.replaceTrack(videoTrack)
          })
          //화면 공유 중지
          const { localStreamTemp } = this.state
          videoTrack.onended = () => {
            let videoTrack = localStreamTemp.getVideoTracks()[0]
            Object.values(peerConnections).forEach(pc => {
              var sender = pc.getSenders().find(function (s) {
                return s.track.kind === videoTrack.kind
              })
              sender.replaceTrack(videoTrack)
            })
            this.setState({
              localStream: localStreamTemp,
              shareScream: false
            })
          }
        })
    } catch (err) {
      console.error("Error: " + err)
    }
  }
  handleWhiteBoard = () => {
    this.setState({
      paintScream: !this.state.paintScream
    })
  }
  //!로컬 stream 작동하지 않으면 안됨
  //!localStream 체크할 필요함
  handleScreamRecording = () => {
    const { enableRecord } = this.state
    console.log(enableRecord)
    if (!enableRecord) {
      let options = { mimeType: "video/webm;codecs=vp9,opus" }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`)
        options = { mimeType: "video/webm;codecs=vp8,opus" }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.error(`${options.mimeType} is not supported`)
          options = { mimeType: "video/webm" }
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not supported`)
            options = { mimeType: "" }
          }
        }
      }

      let mediaRecorder
      try {
        mediaRecorder = new MediaRecorder(this.state.localStream, options)
      } catch (e) {
        console.error("Exception while creating MediaRecorder:", e)
        return
      }

      mediaRecorder.ondataavailable = this.handleDataAvailable
      mediaRecorder.onstop = () => {
        const { recordedBlobs } = this.state
        const blob = new Blob(recordedBlobs, { type: "video/webm" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url

        let currentDay = moment().format("l").replace("/", "_")
        a.download = `${currentDay}.mp4`
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }, 100)
      }
      mediaRecorder.start()
      console.log("MediaRecorder started", mediaRecorder)

      this.setState({
        mediaRecorder,
        enableRecord: !this.state.enableRecord
      })
    } else {
      const { mediaRecorder } = this.state
      mediaRecorder.stop()
      this.setState({
        enableRecord: !this.state.enableRecord
      })
    }
  }
  render() {
    const {
      messages,
      disconnected,
      localStream,
      peerConnections,
      remoteStreams,
      localMicMute,
      localVideoMute,
      isMainRoom,
      fullScream,
      allMuted,
      requestUser,
      outEnable,
      paintScream,
      enableChat,
      normalUserChat,
      shareScream,
      enableRecord,
      testConcentration,
      flagControl
    } = this.state
    console.log(isMainRoom)
    if (disconnected) {
      // disconnect socket
      getSocket().close()
      // stop local audio & video tracks
      this.stopTracks(localStream)

      // stop all remote audio & video tracks
      remoteStreams.forEach(rVideo => this.stopTracks(rVideo.stream))

      const { timeTestConcentrationAPI, isMainRoom } = this.state
      console.log(timeTestConcentrationAPI, isMainRoom)
      if (isMainRoom) clearInterval(timeTestConcentrationAPI)
      // stop all remote peerconnections
      peerConnections &&
        Object.values(peerConnections).forEach(pc => pc.close())

      this.props.history.push("/meetting")
    }

    const windowSize = !fullScream ? "85%" : "100%" 
    console.log("remote", this.state.remoteStreams)
    return (
      <div className="meeting-room">
        <div className="left-content"  style={{ width: windowSize }}>
          <div className="heading-controller">
            {
              isMainRoom ?
              <HeadingController 
                handleOutRoom={this.handleOutRoom}
                handleWindowSize={this.handleWindowSize}
                handleScreenMode={this.handleScreenMode}
                handleWhiteBoard={this.handleWhiteBoard}
                handleScreamRecording={this.handleScreamRecording}
              /> :
              <HeadingControllerStudent 
                handleOutRoom={this.handleOutRoom}
              />
            }
          </div>
          <div className="remote-stream">
            {
              paintScream ? (
                <WhiteBoard/>
              ) :
              (
                isMainRoom ?
                <RemoteStreamContainer 
                  paintScream={!paintScream}
                  remoteStreams={remoteStreams}
                  requestUser={requestUser}
                />
                :
                <RemoteStreamContainerStudent 
                  remoteStreams={remoteStreams}
                />
              )
            }
            {/* <RemoteStreamContainer
              // paintScream={!paintScream}
              switchVideo={this.switchVideo}
              remoteStreams={remoteStreams}
              // isMainRoom={isMainRoom}
              // requestUser={requestUser}
              // handleActionRequestUser={this.handleActionRequestUser}
              // handleUserWarning={this.handleUserWarning}
              // handleDisableChattingToUser={this.handleDisableChattingToUser}
              // //handle for normal user
              // handleUserOutRoom={this.handleUserOutRoom}
              // handleRequestQuestion={this.handleRequestQuestion}
              // handleRequestGoOut={this.handleRequestGoOut}
              // videoStream={
              //   this.state.selectedVideo && this.state.selectedVideo.stream
              // }
              // handleCancelOut={this.handleCancelOut}
              // outEnable={outEnable}
              // testConcentration={testConcentration}
              // handleDownAllTime={this.handleDownAllTime}
              // handleCorrectInput={this.handleCorrectInput}
            /> */}
          </div>
        </div>
        {
          !fullScream && (
            <div className="right-content">
              <div className="local-stream">
                <LocalStreamComponent 
                  localStream={localStream}
                />
              </div>
              <div className="chat-component">
                <ChatComponent/>
              </div>
            </div>
          )
        }
      </div>
    )
  }
}

const mapStateToProps = state => ({})


function mapDispatchToProps(dispatch) {
  let actions = bindActionCreators({ MeetingRoom });
  return { ...actions, dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(MeetingRoom);