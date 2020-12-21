import React, { Component } from "react"
import io from "socket.io-client"

import Video from "../../components/Video"
import LeftContentContainer from "../../components/LeftContentContainer"
import Chat from "../../components/Chat"
import moment from "moment"
import "./style.scss"

import qs from "query-string"
import WhiteBoard from "../../components/WhiteBoard"
import Alert from "../../../../components/Alert"
class Room extends Component {
  constructor(props) {
    super(props)

    this.videoRef = React.createRef()

    this.state = {
      localStream: null, // used to hold local stream object to avoid recreating the stream everytime a new offer comes
      localStreamTemp: null,
      remoteStream: null, // used to hold remote stream object that is displayed in the main screen

      remoteStreams: [], // holds all Video Streams (all remote streams)
      peerConnections: {}, // holds all Peer Connections
      mediaRecorder: null,
      selectedVideo: null,

      status: "Please wait...",

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

      messages: [],
      sendChannels: [],
      requestUser: [],
      recordedBlobs: [],
      disconnected: false,

      localVideoMute: false,
      localMicMute: false,
      flagControl: false,

      isMainRoom: false,
      fullScream: false,

      shareScream: false,
      allMuted: true,

      outEnable: false,
      paintScream: false,
      enableChat: true,
      enableRecord: false,

      normalUserChat: false,
      testConcentration: {
        state: false,
        number: null
      },
      timeTestConcentrationAPI: null
    }
    this.socket = null
  }

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
      // console.log("Got stream with constraints:", constraints);
      console.log(`Using video device: ${videoTracks[0].label}`)

      this.setState({
        localStream: stream
      })
      this.whoisOnline()
      window.stream = stream // make variable available to browser console
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

  whoisOnline = () => {
    // let all peers know I am joining
    this.sendToPeer("onlinePeers", null, {
      local: this.socket.id
    })
  }

  sendToPeer = (messageType, payload, socketID) => {
    this.socket.emit(messageType, {
      socketID,
      payload
    })
  }

  createPeerConnection = (socketID, callback) => {
    try {
      let pc = new RTCPeerConnection(this.state.pc_config)

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
          this.sendToPeer("candidate", e.candidate, {
            local: this.socket.id,
            remote: socketID
          })
        }
      }

      pc.oniceconnectionstatechange = e => {
        // if (pc.iceConnectionState === 'disconnected') {
        //   const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== socketID)
        //   this.setState({
        //     remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
        //   })
        // }
      }

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

          // get currently selected video
          // let selectedVideo = prevState.remoteStreams.filter(stream => stream.id === prevState.selectedVideo.id)
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

  componentDidMount = () => {
    const { room, user } = qs.parse(window.location.search)

    this.socket = io.connect(`${process.env.REACT_APP_SERVER_API}/room`, {
      path: `/io/webrtc`,
      query: {
        room: room,
        username: user
      },
      secure: true
    })

    window.onunload = window.onbeforeunload = function () {
      this.socket.close()
    }

    this.socket.on("connection-success", data => {
      this.getLocalStream()
      const status =
        data.peerCount > 1
          ? `Room : ${room}: ${data.peerCount}`
          : "기다리는 중.."
      const { isHost } = data

      //집중도 테스트함
      let intervalTime = ""

      //default 1분
      if (isHost) {
        const time = localStorage.getItem("time")
          ? localStorage.getItem("time")
          : 1
        console.log(time)
        intervalTime = setInterval(() => {
          var min = 0,
            max = 10
          var rand = Math.floor(Math.random() * (max - min + 1) + min)
          this.sendToPeer(
            "test-concentration",
            {
              number: rand
            },
            null
          )
        }, 1000 * Number(time) * 60)
      }

      this.setState({
        status: status,
        isMainRoom: isHost,
        timeTestConcentrationAPI: intervalTime,
        messages: data.messages,
        localMicMute: isHost ? false : true
      })
    })

    this.socket.on("joined-peers", data => {
      this.setState({
        status:
          data.peerCount > 1
            ? `Room : ${room}: ${data.peerCount}`
            : "기다리는 중.."
      })
    })

    // ************************************* //
    // ************************************* //

    this.socket.on("peer-disconnected", data => {
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
            status:
              data.peerCount > 1
                ? `Room : ${room}: ${data.peerCount}`
                : "기다리는 중.."
          }
        })
      } catch (error) {
        console.log(error)
      }
    })

    // this.socket.on('offerOrAnswer', (sdp) => {

    //   this.textref.value = JSON.stringify(sdp)

    //   // set sdp as remote description
    //   this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    // })

    this.socket.on("online-peer", socketID => {
      // console.log('connected peers ...', socketID)

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
            this.sendToPeer("offer", sdp, {
              local: this.socket.id,
              remote: socketID
            })
          })
        }
      })
    })

    this.socket.on("offer", data => {
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
          // const file = fileInput.files[0];
          // // if (receivedSize === file.size) {
          // const received = new Blob(receiveBuffer);
          // receiveBuffer = [];

          // const url = window.URL.createObjectURL(blob);
          // const a = document.createElement('a');
          // a.textContent =  `Click to download '${file.name}' (${file.size} bytes)`;
          // a.display='block';
          // a.download = file.name;
          // a.href = url;
          // document.body.appendChild(a);

          const message = JSON.parse(event.data)
          // console.log(message)
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

              this.sendToPeer("answer", sdp, {
                local: this.socket.id,
                remote: data.socketID
              })
            })
          }
        )
      })
    })

    this.socket.on("answer", data => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID]
      // console.log(data.sdp)
      pc.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      ).then(() => {})
    })

    this.socket.on("candidate", data => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID]

      if (pc) pc.addIceCandidate(new RTCIceCandidate(data.candidate))
    })

    //모든 유저를 Mic On/Of
    this.socket.on("request_mic_mute", data => {
      this.setState({
        localMicMute: !this.state.localMicMute,
        flagControl: !this.state.flagControl
      })
      // get remote's peerConnection
    })

    // Host User
    this.socket.on("request_question", data => {
      const { remoteSocketId, remoteUsername } = data
      let value = {
        type: "question",
        remoteId: remoteSocketId,
        state: false,
        remoteUsername: remoteUsername
      }

      this.setState({
        requestUser: [...this.state.requestUser, value]
      })
      // get remote's peerConnection
    })

    //Host User
    this.socket.on("request_out", data => {
      console.log("request_out")
      const { remoteSocketId, remoteUserName } = data
      let value = {
        type: "out",
        remoteId: remoteSocketId,
        state: false,
        remoteUserName: remoteUserName
      }
      this.setState({
        requestUser: [...this.state.requestUser, value]
      })
    })

    // normal User reqest question
    this.socket.on("action_user_request_question", data => {
      if (data === "accept") {
        this.setState({
          localMicMute: false,
          flagControl: !this.state.flagControl
        })
      } else {
        this.setState({
          localMicMute: true,
          flagControl: !this.state.flagControl
        })
      }
    })

    // normal User
    this.socket.on("action_user_request_out_normaluser", data => {
      data === "reject"
        ? this.setState({ outEnable: false })
        : this.setState({ outEnable: true })
    })

    // host User
    this.socket.on("action_user_request_out_host", data => {
      const { type, remoteSocketId } = data
      let requestUserTemp = []
      if (type === "accept") {
        requestUserTemp = this.state.requestUser.map(element => {
          if (element.remoteId === remoteSocketId) {
            let elementTemp = { ...element, state: true }
            return elementTemp
          } else {
            return element
          }
        })
        console.log(requestUserTemp)
      } else {
        requestUserTemp = this.state.requestUser.filter(
          element => element.remoteId !== remoteSocketId
        )
      }
      this.setState({
        requestUser: requestUserTemp
      })
    })

    this.socket.on("action_host_request_cancel_out", data => {
      const remoteSocketId = data
      let requestUserTemp = this.state.requestUser.filter(
        element => element.remoteId !== remoteSocketId
      )
      this.setState({
        requestUser: requestUserTemp
      })
    })
    this.socket.on("action_host_chat", data => {
      this.setState({
        normalUserChat: !this.state.normalUserChat
      })
    })
    this.socket.on("action_user_warning", data => {
      let message = {
        type: "text-request",
        message: {
          id: data,
          sender: {
            uid: data,
            username: "강사"
          },
          data: {
            text: "경고 메시지"
          }
        }
      }
      this.setState({
        messages: [...this.state.messages, message]
      })
    })

    this.socket.on("action_user_disable_chatting", data => {
      let message = {
        type: "text-request",
        message: {
          id: data,
          sender: {
            uid: data,
            username: "강사"
          },
          data: {
            text: "강사님, 채팅 금지"
          }
        }
      }
      this.setState({
        normalUserChat: !this.state.normalUserChat,
        messages: [...this.state.messages, message]
      })
    })

    this.socket.on("test-concentration", data => {
      const { isMainRoom } = this.state
      if (!isMainRoom) {
        this.setState({
          testConcentration: {
            ...this.state.testConcentration,
            state: true,
            number: data.number
          }
        })
      }
    })
    this.socket.on("upfile-in-chat", data => {
      const { fileHash, originalname, size, mimetype } = data
      const { username } = this.socket.query
      let message = {
        type: "file",
        message: {
          id: data,
          sender: {
            uid: this.socket.id,
            username
          },
          data: {
            text: originalname,
            size: size,
            fileHash: fileHash,
            mimetype
          }
        }
      }
      this.setState({
        messages: [...this.state.messages, message]
      })
    })

    //   this.socket.on("test-concentration_fail", (data) => {
    //     const {remoteSocketId, remoteUserName } = data
    //     let value = {
    //       type: "text-alert",
    //       remoteId: remoteSocketId,
    //       state: false,
    //       remoteUserName: remoteUserName
    //     }
    //     this.setState({
    //       requestUser: [...this.state.requestUser, value]
    //     })
    // })
  }

  // ************************************* //
  // NOT REQUIRED
  // ************************************* //
  disconnectSocket = socketToDisconnect => {
    this.sendToPeer("socket-to-disconnect", null, {
      local: this.socket.id,
      remote: socketToDisconnect
    })
  }

  switchVideo = _video => {
    // console.log(_video)
    this.setState({
      selectedVideo: _video
    })
  }

  // ************************************* //
  // ************************************* //
  stopTracks = stream => {
    stream.getTracks().forEach(track => track.stop())
  }

  handleMuteMic = () => {
    this.setState({
      localMicMute: !this.state.localMicMute
    })
  }
  handleMuteVideo = () => {
    this.setState({
      localVideoMute: !this.state.localVideoMute
    })
  }

  handleShareDisplayMedia = async () => {
    try {
      navigator.mediaDevices
        .getDisplayMedia({
          video: {
            cursor: "always"
          },
          audio: true
        })
        .then(stream => {
          console.log(stream)
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
  handleAllMuteMic = async () => {
    this.setState({
      allMuted: !this.state.allMuted
    })
    this.sendToPeer("allmute", null, {
      local: this.socket.id
    })
  }
  // host user send server and check
  handleActionRequestUser = async (socketId, type, method) => {
    let requestUserTemp = []
    if (type === "accept") {
      requestUserTemp = this.state.requestUser.map(element => {
        if (element.remoteId === socketId) {
          let elementTemp = { ...element, state: true }
          return elementTemp
        } else {
          return element
        }
      })
    } else {
      //reject
      requestUserTemp = this.state.requestUser.filter(
        element => element.remoteId !== socketId
      )
    }

    this.setState({
      requestUser: requestUserTemp
    })
    this.sendToPeer(
      "action_user_request",
      { type, method },
      {
        remoteSocketId: socketId
      }
    )
  }
  //normal user 자리 취소
  handleCancelOut = () => {
    this.sendToPeer("action_user_request_cancel_out", null, {
      local: this.socket.id
    })
    this.setState({
      outEnable: !this.state.outEnable
    })
  }

  //end to normal user
  //질문 요청
  handleRequestQuestion = async () => {
    // requestUserTemp = this.state.requestUser.filter(element => element.remoteId !== remoteSocketId);
    this.sendToPeer("request_question", null, {
      local: this.socket.id
    })
    const { username } = this.socket.query
    let message = {
      type: "text-request",
      message: {
        id: this.socket.id,
        sender: {
          uid: this.socket.id,
          username
        },
        data: {
          text: "질문 요청"
        }
      }
    }
    this.state.sendChannels.forEach(sendChannel => {
      sendChannel.readyState === "open" &&
        sendChannel.send(JSON.stringify(message))
    })
    this.sendToPeer("new-message", JSON.stringify(message), {
      local: this.socket.id
    })
    this.setState({
      messages: [...this.state.messages, message]
    })
  }
  handleRequestQuestionForChat = () => {}

  //자리비움 요청
  handleRequestGoOut = async () => {
    this.sendToPeer("request_out", null, {
      local: this.socket.id
    })
    const { username } = this.socket.query
    let message = {
      type: "text-request",
      message: {
        id: this.socket.id,
        sender: {
          uid: this.socket.id,
          username
        },
        data: {
          text: "자리 비움 요청"
        }
      }
    }
    this.state.sendChannels.forEach(sendChannel => {
      sendChannel.readyState === "open" &&
        sendChannel.send(JSON.stringify(message))
    })
    this.sendToPeer("new-message", JSON.stringify(message), {
      local: this.socket.id
    })
    this.setState({
      messages: [...this.state.messages, message]
    })
  }
  handleRequestGoOutForChat = () => {}

  handlePaintScream = () => {
    this.setState({
      paintScream: !this.state.paintScream
    })
  }
  handleControlChat = () => {
    this.sendToPeer("action_host_chat", null, {
      local: this.socket.id
    })
    this.setState({
      enableChat: !this.state.enableChat
    })
  }
  handleOutRoom = () => {
    const { remoteStreams } = this.state
    if (remoteStreams.length !== 0) {
      Alert({
        title: "수업을 종료하시겠습니까?",
        content: `핵생이 남아있는 경우, 모도 퇴장됩니다.`,
        handleClickAccept: () => {
          //accept
          this.setState({
            disconnected: true
          })
          // this.props.history.push("/meetting");
        },
        handleClickReject: () => {} //reject
      })
    } else {
      Alert({
        title: "수업을 종료하시겠습니까?",
        // content: `핵생이 남아있는 경우, 모도 퇴장됩니다.`,
        handleClickAccept: () => {
          //accept
          this.setState({
            disconnected: true
          })
          // this.props.history.push("/meetting");
        },
        handleClickReject: () => {} //reject
      })
    }
  }
  handleUserOutRoom = () => {
    Alert({
      title: "수업을 종료하시겠습니까?",
      // content: `핵생이 남아있는 경우, 모도 퇴장됩니다.`,
      handleClickAccept: () => {
        //accept
        this.setState({
          disconnected: true
        })
        // this.props.history.push("/meetting");
      },
      handleClickReject: () => {} //reject
    })
  }
  handleDataAvailable = event => {
    if (event.data && event.data.size > 0) {
      this.setState({
        recordedBlobs: [event.data]
      })
    }
  }
  handleStreamRecord = () => {
    const { enableRecord } = this.state
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
  handleUserWarning = (socketId, type, method) => {
    this.sendToPeer(
      "action_user_warning",
      { type, method },
      {
        remoteSocketId: socketId
      }
    )
  }

  handleDisableChattingToUser = (socketId, type, method) => {
    this.sendToPeer(
      "action_user_disable_chatting",
      { type, method },
      {
        remoteSocketId: socketId
      }
    )
  }
  handleCorrectInput = () => {
    this.setState({
      testConcentration: {
        ...this.state.testConcentration,
        number: null,
        state: false
      }
    })
  }
  handleDownAllTime = () => {
    // this.sendToPeer("test-concentration_fail", null, {
    //   local: this.socket.id,
    // });
    const { username } = this.socket.query
    let message = {
      type: "text-alert",
      message: {
        id: this.socket.id,
        sender: {
          uid: this.socket.id,
          username
        },
        data: {
          text: "집중도 테스트 실패했습니다."
        }
      }
    }
    this.state.sendChannels.forEach(sendChannel => {
      sendChannel.readyState === "open" &&
        sendChannel.send(JSON.stringify(message))
    })
    this.sendToPeer("new-message", JSON.stringify(message), {
      local: this.socket.id
    })
    this.setState({
      messages: [...this.state.messages, message]
    })
  }
  handleOffChatForUser = (socketId, type, method) => {
    if ((socketId = "allmute")) {
      this.sendToPeer("action_host_chat", null, {
        local: this.socket.id
      })
    } else {
      this.sendToPeer(
        "action_user_disable_chatting",
        { type, method },
        {
          remoteSocketId: socketId
        }
      )
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
    if (disconnected) {
      // disconnect socket
      this.socket.close()
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

    const fullSize = !fullScream ? "85%" : "100%"

    return (
      <div className="room-page">
        <div className="room-page__left" style={{ width: fullSize }}>
          {isMainRoom ? (
            //Default scream & full scream
            <div
              className={
                !fullScream ? "left-top__defaultSize" : "left-top__fullSize"
              }
            >
              <div className="out-full-btn">
                <i
                  className="material-icons out-btn"
                  onClick={() => this.handleOutRoom()}
                >
                  exit_to_app
                </i>
                <i
                  className="material-icons"
                  onClick={() =>
                    this.setState({ fullScream: !this.state.fullScream })
                  }
                >
                  {fullScream ? "fullscreen_exit" : "fullscreen"}
                </i>
              </div>
              <div className="video-task-btn">
                <i
                  className="material-icons"
                  onClick={() => this.handleAllMuteMic()}
                  style={!allMuted ? { color: "red" } : {}}
                >
                  {" "}
                  {!allMuted ? "volume_off" : "volume_up"}{" "}
                </i>
                <i
                  className="material-icons"
                  onClick={() => this.handleMuteMic()}
                  style={localMicMute ? { color: "red" } : {}}
                >
                  {localMicMute ? "mic_off" : "mic"}
                </i>
                <i
                  className="material-icons"
                  onClick={() => this.handleStreamRecord()}
                  style={enableRecord ? { color: "red" } : {}}
                >
                  {" "}
                  switch_video{" "}
                </i>
                <i
                  className="material-icons"
                  onClick={() => this.handleMuteVideo()}
                  style={localVideoMute ? { color: "red" } : {}}
                >
                  {(localVideoMute && "videocam_off") || "videocam"}
                </i>
              </div>
              <div className="point-btn">
                {/* <i className="material-icons" onClick={() => this.handleControlChat()} style={enableChat ? {} : {color: "red" }}>
                      {enableChat ? "speaker_notes" : "speaker_notes_off"}
                    </i> */}
                <i
                  className="material-icons"
                  onClick={() => this.handleShareDisplayMedia()}
                  style={shareScream ? { color: "red" } : {}}
                >
                  laptop
                </i>
                <i
                  className="material-icons"
                  onClick={() => this.handlePaintScream()}
                  style={paintScream ? { color: "red" } : {}}
                >
                  dvr
                </i>
              </div>
            </div>
          ) : (
            <div className="left-normaluser">
              {!localMicMute && (
                <>
                  <p>마이크 요청이 수락됩니다.</p>
                  <p>
                    <i className="material-icons">mic</i>
                  </p>
                </>
              )}
            </div>
          )}
          <div className="left-content">
            {paintScream ? (
              <WhiteBoard />
            ) : (
              <LeftContentContainer
                paintScream={!paintScream}
                switchVideo={this.switchVideo}
                remoteStreams={remoteStreams}
                isMainRoom={isMainRoom}
                requestUser={requestUser}
                handleActionRequestUser={this.handleActionRequestUser}
                handleUserWarning={this.handleUserWarning}
                handleDisableChattingToUser={this.handleDisableChattingToUser}
                //handle for normal user
                handleUserOutRoom={this.handleUserOutRoom}
                handleRequestQuestion={this.handleRequestQuestion}
                handleRequestGoOut={this.handleRequestGoOut}
                videoStream={
                  this.state.selectedVideo && this.state.selectedVideo.stream
                }
                handleCancelOut={this.handleCancelOut}
                outEnable={outEnable}
                testConcentration={testConcentration}
                handleDownAllTime={this.handleDownAllTime}
                handleCorrectInput={this.handleCorrectInput}
              />
            )}
          </div>
        </div>

        {
          //localhost
          !fullScream && (
            <div className="room-page__right">
              <div className="wrapper-localVideo">
                <Video
                  videoType="localVideo"
                  videoStyles={{
                    width: "100%",
                    height: "100%"
                  }}
                  frameStyle={{
                    height: "100%",
                    borderRadius: 5,
                    backgroundColor: "black"
                  }}
                  localMicMute={localMicMute}
                  localVideoMute={localVideoMute}
                  videoStream={localStream}
                  showMuteControls={true}
                  isMainRoom={isMainRoom}
                  flagControl={flagControl}
                  autoPlay
                  muted //local default true
                ></Video>
              </div>
              <div className="wrapper-localChatting">
                <Chat
                  normalUserChat={isMainRoom ? false : normalUserChat}
                  handleActionRequestUser={this.handleActionRequestUser}
                  isMainRoom={isMainRoom}
                  handleOffChatForUser={this.handleOffChatForUser}
                  user={{
                    uid: (this.socket && this.socket.id) || ""
                  }}
                  remoteStreams={remoteStreams}
                  messages={messages}
                  sendMessage={message => {
                    // console.log(message)
                    this.setState(prevState => {
                      return {
                        messages: [...prevState.messages, message]
                      }
                    })
                    const { username } = this.socket.query
                    message.message.sender.username = username
                    // send channels
                    this.state.sendChannels.forEach(sendChannel => {
                      sendChannel.readyState === "open" &&
                        sendChannel.send(JSON.stringify(message))
                    })
                    // message.sender.username = username;
                    this.sendToPeer("new-message", JSON.stringify(message), {
                      local: this.socket.id
                    })
                  }}
                />
              </div>
            </div>
          )
        }
      </div>
    )
  }
}

export default Room
