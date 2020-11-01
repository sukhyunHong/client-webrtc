import React, { Component } from 'react';
import io from 'socket.io-client'



import Video from '../../components/Video'
import Videos from '../../components/Videos'
import Chat from '../../components/Chat'
import Draggable from '../../components/Draggable'

import qs from 'query-string'
class Room extends Component {
  constructor(props) {
    super(props)

    this.state = {
      localStream: null,    // used to hold local stream object to avoid recreating the stream everytime a new offer comes
      remoteStream: null,    // used to hold remote stream object that is displayed in the main screen

      remoteStreams: [],    // holds all Video Streams (all remote streams)
      peerConnections: {},  // holds all Peer Connections
      selectedVideo: null,

      status: 'Please wait...',

      pc_config: {
        "iceServers": [
          {
            urls: 'stun:stun.l.google.com:19302'
          }
        ]
      },

      sdpConstraints: {
        'mandatory': {
          'OfferToReceiveAudio': true,
          'OfferToReceiveVideo': true
        }
      },

      messages: [],
      sendChannels: [],
      disconnected: false,


      localVideoMute: false,
      localMicMute: false,

      isMainRoom: false
    }
    this.socket = null
  }

  getLocalStream = () => {
    // called when getUserMedia() successfully returns - see below
    // getUserMedia() returns a MediaStream object (https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
    const success = (stream) => {
      window.localStream = stream
      // this.localVideoref.current.srcObject = stream
      // this.pc.addStream(stream);
      this.setState({
        localStream: stream
      })

      this.whoisOnline()
    }

    // called when getUserMedia() fails - see below
    const failure = (e) => {
      console.log('getUserMedia Error: ', e)
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    // see the above link for more constraint options
    const constraints = {
      audio: true,
      video: true,
      // video: {
      //   width: 1280,
      //   height: 720
      // },
      // video: {
      //   width: { min: 1280 },
      // }
      options: {
        mirror: true,
      }
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    navigator.mediaDevices.getUserMedia(constraints)
      .then(success)
      .catch(failure)
  }

  whoisOnline = () => {
    // let all peers know I am joining
    this.sendToPeer('onlinePeers', null, { local: this.socket.id })
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
      const peerConnections = { ...this.state.peerConnections, [socketID]: pc }
      this.setState({
        peerConnections
      })

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          this.sendToPeer('candidate', e.candidate, {
            local: this.socket.id,
            remote: socketID
          })
        }
      }

      pc.oniceconnectionstatechange = (e) => {
        // if (pc.iceConnectionState === 'disconnected') {
        //   const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== socketID)

        //   this.setState({
        //     remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
        //   })
        // }

      }

      pc.ontrack = (e) => {

        let _remoteStream = null
        let remoteStreams = this.state.remoteStreams
        let remoteVideo = {}



        // 1. check if stream already exists in remoteStreams
        const rVideos = this.state.remoteStreams.filter(stream => stream.id === socketID)

        // 2. if it does exist then add track
        if (rVideos.length) {
          _remoteStream = rVideos[0].stream
          _remoteStream.addTrack(e.track, _remoteStream)

          remoteVideo = {
            ...rVideos[0],
            stream: _remoteStream,
          }
          remoteStreams = this.state.remoteStreams.map(_remoteVideo => {
            return _remoteVideo.id === remoteVideo.id && remoteVideo || _remoteVideo
          })
        } else {
          // 3. if not, then create new stream and add track
          _remoteStream = new MediaStream()
          _remoteStream.addTrack(e.track, _remoteStream)

          remoteVideo = {
            id: socketID,
            name: socketID,
            stream: _remoteStream,
          }
          remoteStreams = [...this.state.remoteStreams, remoteVideo]
        }

        // const remoteVideo = {
        //   id: socketID,
        //   name: socketID,
        //   stream: e.streams[0]
        // }

        this.setState(prevState => {

          // If we already have a stream in display let it stay the same, otherwise use the latest stream
          // const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: e.streams[0] }
          const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: _remoteStream }

          // get currently selected video
          // let selectedVideo = prevState.remoteStreams.filter(stream => stream.id === prevState.selectedVideo.id)
          let selectedVideo = prevState.remoteStreams[0] ?  prevState.remoteStreams[0] : []

          // if the video is still in the list, then do nothing, otherwise set to new video stream
          selectedVideo = selectedVideo.length ? {} : { selectedVideo: remoteVideo }

          return {
            // selectedVideo: remoteVideo,
            ...selectedVideo,
            // remoteStream: e.streams[0],
            ...remoteStream,
            remoteStreams, //: [...prevState.remoteStreams, remoteVideo]
          }
        })
      }
      pc.close = () => {
        // alert('GONE')
        console.log("pc closed");
      }

      if (this.state.localStream)
        // pc.addStream(this.state.localStream)

        this.state.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.state.localStream)
        })
      // return pc
      callback(pc)

    } catch (e) {
      console.log('Something went wrong! pc not created!!', e)
      // return;
      callback(null)
    }
  }

  componentDidMount = () => {
    const { room, user } = qs.parse(window.location.search);
    console.log(room)
    this.socket = io.connect(
      `${process.env.REACT_APP_SERVER_API}/room`,
      {
        path: `/io/webrtc`,
        query: {
          room: room, //변수를 받아서 Socket를 그룹을 나눔
          username: user
        }
      }
    )

    this.socket.on('connection-success', data => {

      this.getLocalStream()

      // console.log(data.success)
      const status = data.peerCount > 1 ? `Room : ${room}: ${data.peerCount}` : '기다리는 중..'

      this.setState({
        status: status,
        isMainRoom: data.peerCount === 1 ? true : false,
        messages: data.messages
      })
    })

    this.socket.on('joined-peers', data => {

      this.setState({
        status: data.peerCount > 1 ? `Room : ${room}: ${data.peerCount}` : '기다리는 중..'
      })
    })

    // ************************************* //
    // ************************************* //

    this.socket.on('peer-disconnected', data => {

      // close peer-connection with this peer
      this.state.peerConnections[data.socketID].close()

      // get and stop remote audio and video tracks of the disconnected peer
      const rVideo = this.state.remoteStreams.filter(stream => stream.id === data.socketID)
      rVideo && this.stopTracks(rVideo[0].stream)

      // filter out the disconnected peer stream
      const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== data.socketID)

      this.setState(prevState => {
        // check if disconnected peer is the selected video and if there still connected peers, then select the first
        const selectedVideo = prevState.selectedVideo.id === data.socketID && remoteStreams.length ? { selectedVideo: remoteStreams[0] } : null

        return {
          // remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
          remoteStreams,
          ...selectedVideo,
          status: data.peerCount > 1 ? `Room : ${room}: ${data.peerCount}` : '기다리는 중..'
        }
      }
      )
    })

    // this.socket.on('offerOrAnswer', (sdp) => {

    //   this.textref.value = JSON.stringify(sdp)

    //   // set sdp as remote description
    //   this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    // })

    this.socket.on('online-peer', socketID => {
      // console.log('connected peers ...', socketID)

      // create and send offer to the peer (data.socketID)
      // 1. Create new pc
      this.createPeerConnection(socketID, pc => {
        // 2. Create Offer
        if (pc) {
          // Send Channel 
          const handleSendChannelStatusChange = (event) => {
            console.log('send channel status: ' + this.state.sendChannels[0].readyState)
          }

          const sendChannel = pc.createDataChannel('sendChannel')
          sendChannel.onopen = handleSendChannelStatusChange
          sendChannel.onclose = handleSendChannelStatusChange

          this.setState(prevState => {
            return {
              sendChannels: [...prevState.sendChannels, sendChannel]
            }
          })


          // Receive Channels
          const handleReceiveMessage = (event) => {
            const message = JSON.parse(event.data)
            console.log("handleReceiveMessage", message)
            this.setState(prevState => {
              return {
                messages: [...prevState.messages, message]
              }
            })
          }

          const handleReceiveChannelStatusChange = (event) => {
            if (this.receiveChannel) {
              console.log("receive channel's status has changed to " + this.receiveChannel.readyState);
            }
          }

          const receiveChannelCallback = (event) => {
            const receiveChannel = event.channel
            receiveChannel.onmessage = handleReceiveMessage
            receiveChannel.onopen = handleReceiveChannelStatusChange
            receiveChannel.onclose = handleReceiveChannelStatusChange
          }

          pc.ondatachannel = receiveChannelCallback


          pc.createOffer(this.state.sdpConstraints)
            .then(sdp => {
              pc.setLocalDescription(sdp)
              this.sendToPeer('offer', sdp, {
                local: this.socket.id,
                remote: socketID
              })
            })
        }
      })
    })

    this.socket.on('offer', data => {
      this.createPeerConnection(data.socketID, pc => {
        pc.addStream(this.state.localStream)

        // Send Channel
        const handleSendChannelStatusChange = (event) => {
          // console.log('send channel status: ' + this.state.sendChannels[0].readyState)
        }

        const sendChannel = pc.createDataChannel('sendChannel')
        sendChannel.onopen = handleSendChannelStatusChange
        sendChannel.onclose = handleSendChannelStatusChange

        this.setState(prevState => {
          return {
            sendChannels: [...prevState.sendChannels, sendChannel]
          }
        })

        // Receive Channels
        const handleReceiveMessage = (event) => {
          const message = JSON.parse(event.data)
          // console.log(message)
          this.setState(prevState => {
            return {
              messages: [...prevState.messages, message]
            }
          })
        }

        const handleReceiveChannelStatusChange = (event) => {
          if (this.receiveChannel) {
            console.log("receive channel's status has changed to " + this.receiveChannel.readyState);
          }
        }

        const receiveChannelCallback = (event) => {
          const receiveChannel = event.channel
          receiveChannel.onmessage = handleReceiveMessage
          receiveChannel.onopen = handleReceiveChannelStatusChange
          receiveChannel.onclose = handleReceiveChannelStatusChange
        }

        pc.ondatachannel = receiveChannelCallback

        pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {
          // 2. Create Answer
          pc.createAnswer(this.state.sdpConstraints)
            .then(sdp => {
              pc.setLocalDescription(sdp)

              this.sendToPeer('answer', sdp, {
                local: this.socket.id,
                remote: data.socketID
              })
            })
        })
      })
    })

    this.socket.on('answer', data => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID]
      // console.log(data.sdp)
      pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => { })
    })

    this.socket.on('candidate', (data) => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID]

      if (pc)
        pc.addIceCandidate(new RTCIceCandidate(data.candidate))
    })

    // const pc_config = null

    // const pc_config = {
    //   "iceServers": [
    //     // {
    //     //   urls: 'stun:[STUN_IP]:[PORT]',
    //     //   'credentials': '[YOR CREDENTIALS]',
    //     //   'username': '[USERNAME]'
    //     // },
    //     {
    //       urls : 'stun:stun.l.google.com:19302'
    //     }
    //   ]
    // }

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
    // create an instance of RTCPeerConnection
    // this.pc = new RTCPeerConnection(this.state.pc_config)

    // triggered when a new candidate is returned
    // this.pc.onicecandidate = (e) => {
    //   // send the candidates to the remote peer
    //   // see addCandidate below to be triggered on the remote peer
    //   if (e.candidate) {
    //     // console.log(JSON.stringify(e.candidate))
    //     this.sendToPeer('candidate', e.candidate)
    //   }
    // }

    // triggered when there is a change in connection state
    // this.pc.oniceconnectionstatechange = (e) => {
    //   console.log(e)
    // }

    // triggered when a stream is added to pc, see below - this.pc.addStream(stream)
    // this.pc.onaddstream = (e) => {
    //   this.remoteVideoref.current.srcObject = e.stream
    // }

    // this.pc.ontrack = (e) => {
    //   debugger
    //   // this.remoteVideoref.current.srcObject = e.streams[0]

    //   this.setState({
    //     remoteStream: e.streams[0]
    //   })
    // }

  }

  // ************************************* //
  // NOT REQUIRED
  // ************************************* //
  disconnectSocket = (socketToDisconnect) => {
    this.sendToPeer('socket-to-disconnect', null, {
      local: this.socket.id,
      remote: socketToDisconnect
    })
  }

  switchVideo = (_video) => {
    // console.log(_video)
    this.setState({
      selectedVideo: _video
    })
  }

  // ************************************* //
  // ************************************* //
  stopTracks = (stream) => {
    stream.getTracks().forEach(track => track.stop())
  }

  handleMuteMic = () => {
    this.setState({localMicMute : !this.state.localMicMute })
  }
  handleMuteVideo = () => {
    this.setState({localVideoMute : !this.state.localVideoMute })
  }
  render() {
    const {
      status,
      messages,
      disconnected,
      localStream,
      peerConnections,
      remoteStreams,
      localMicMute,
      localVideoMute,
      isMainRoom
    } = this.state
    if (disconnected) {
      // disconnect socket
      this.socket.close()
      // stop local audio & video tracks
      this.stopTracks(localStream)

      // stop all remote audio & video tracks
      remoteStreams.forEach(rVideo => this.stopTracks(rVideo.stream))

      // stop all remote peerconnections
      peerConnections && Object.values(peerConnections).forEach(pc => pc.close())

      return (<div>You have successfully Disconnected</div>)
    }

    const statusText = <div style={{ color: 'yellow', padding: 5 }}>{status}</div>

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            height: "100vh",
            width: "85%",
          }}
        >
          <div
            style={{
              height: "10%",
              background: "black",
              display: "flex",
              justifyContent: "space-between",
              padding: "0 20px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  // margin: 10,
                  backgroundColor: "#cdc4ff4f",
                  padding: 10,
                  borderRadius: 5,
                  // background: 'blue',
                  textAlign: "center",
                }}
              >
                <i
                  onClick={(e) => {
                    this.setState({ disconnected: true });
                  }}
                  style={{ cursor: "pointer", color: "red" }}
                  className="material-icons"
                >
                  highlight_off
                </i>
                {statusText}
              </div>
              <i
                style={{
                  cursor: "pointer",
                  outline: "none",
                  padding: 15,
                  fontSize: 25,
                  color: "white" || "red",
                }}
                className="material-icons"
              >
                {(true && "input") || "input"}
              </i>
              <i
                style={{
                  cursor: "pointer",
                  padding: 15,
                  fontSize: 25,
                  color: "white" || "red",
                }}
                className="material-icons"
              >
                {(true && "crop_free") || "crop_free"}
              </i>
            </div>
            <div>
              <i
                style={{
                  cursor: "pointer",
                  outline: "none",
                  padding: 15,
                  fontSize: 25,
                  color: "white" || "red",
                }}
                className="material-icons"
              >
                {(true && "campaign") || "campaign"}
              </i>
              <i
                onClick={() => this.handleMuteMic()}
                style={{
                  cursor: "pointer",
                  outline: "none",
                  padding: 15,
                  fontSize: 25,
                  color: "white" || "red",
                }}
                className="material-icons"
              >
                {(!localMicMute && "mic") || "mic_off"}
              </i>
              <i
                onClick={() => this.handleMuteVideo()}
                style={{
                  cursor: "pointer",
                  outline: "none",
                  padding: 15,
                  fontSize: 25,
                  color: "white" || "red",
                }}
                className="material-icons"
              >
                {(!localVideoMute && "videocam") || "videocam_off"}
              </i>
            </div>
            <div>
              <i
                style={{
                  cursor: "pointer",
                  padding: 15,
                  fontSize: 25,
                  color: "white" || "red",
                }}
                className="material-icons"
              >
                {(true && "laptop") || "laptop"}
              </i>
            </div>
          </div>
          <div
            style={{
              height: "90%",
            }}
          >
            {/* <Draggable style={{
                    zIndex: 101,
                    position: 'absolute',
                    right: 0,
                    cursor: 'move',
                }}>
                    <Video
                        videoType='localVideo'
                        videoStyles={{
                            // zIndex:2,
                            // position: 'absolute',
                            // right:0,
                            width: 200,
                            // height: 200,
                            // margin: 5,
                            // backgroundColor: 'black'
                        }}
                        frameStyle={{
                            width: 200,
                            margin: 5,
                            borderRadius: 5,
                            backgroundColor: 'black',
                        }}
                        showMuteControls={true}
                        // ref={this.localVideoref}
                        videoStream={localStream}
                        autoPlay muted>
                    </Video>
                </Draggable> */}
            {/* <div style={{
                    zIndex: 3,
                    position: 'absolute',
                }}>
                    <i onClick={(e) => { this.setState({ disconnected: true }) }} style={{ cursor: 'pointer', paddingLeft: 15, color: 'red' }} class='material-icons'>highlight_off</i>
                    <div style={{
                        margin: 10,
                        backgroundColor: '#cdc4ff4f',
                        padding: 10,
                        borderRadius: 5,
                        background: 'blue'
                    }}>{statusText}</div>
                </div> */}
            <Videos
              switchVideo={this.switchVideo}
              remoteStreams={remoteStreams}
              isMainRoom={isMainRoom}
              // videoStream={this.state.selectedVideo && this.state.selectedVideo.stream}
            ></Videos>

            {/* <Chat
                    user={{
                        uid: this.socket && this.socket.id || ''
                    }}
                    messages={messages}
                    sendMessage={(message) => {
                        this.setState(prevState => {
                            return { messages: [...prevState.messages, message] }
                        })
                        this.state.sendChannels.map(sendChannel => {
                            sendChannel.readyState === 'open' && sendChannel.send(JSON.stringify(message))
                        })
                        this.sendToPeer('new-message', JSON.stringify(message), { local: this.socket.id })
                    }}
                /> */}
          </div>
        </div>
        <div
          style={{
            width: "15%",
            minWidth: "300px",
          }}
        >
          <div style={{ height: "20%" }}>
            <Draggable
              style={{
                zIndex: 101,
                height: "100%",
                // position: 'absolute',
                // right: 0,
                cursor: "move",
              }}
            >
              <Video
                videoType="localVideo"
                videoStyles={{
                  // zIndex:2,
                  // position: 'absolute',
                  // right:0,
                  width: "100%",
                  height: "100%",
                  // margin: 5,
                  // backgroundColor: 'black'
                }}
                frameStyle={{
                  // width: 200,
                  // margin: 5,
                  height: "100%",
                  borderRadius: 5,
                  backgroundColor: "black",
                }}
                showMuteControls={false}
                localMicMute={localMicMute}
                localVideoMute={localVideoMute}
                // ref={this.localVideoref}
                videoStream={localStream}
                autoPlay
                muted
              ></Video>
            </Draggable>
          </div>
          <Chat
            user={{
              uid: (this.socket && this.socket.id) || "",
            }}
            messages={messages}
            sendMessage={(message) => {
              this.setState((prevState) => {
                return { messages: [...prevState.messages, message] };
              });
              const { username } = this.socket.query;
              message.message.sender.username = username;
              // send channels
              this.state.sendChannels.map((sendChannel) => {
                sendChannel.readyState === "open" &&
                  sendChannel.send(JSON.stringify(message));
              });
              // message.sender.username = username;
              this.sendToPeer("new-message", JSON.stringify(message), {
                local: this.socket.id,
              });
            }}
          />
        </div>
      </div>
    );
  }
}

export default Room;