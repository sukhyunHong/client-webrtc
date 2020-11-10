import React, { Component } from "react";
import io from "socket.io-client";

import Video from "../../components/Video";
import LeftContentContainer from "../../components/LeftContentContainer";
import Chat from "../../components/Chat";
import Draggable from "../../components/Draggable";
import './style.scss'

import qs from "query-string";
import WhiteBoard from "../../components/WhiteBoard";
import Alert from "../../../../components/Alert";
class Room extends Component {
  constructor(props) {
    super(props);

    this.videoRef = React.createRef();

    this.state = {
      localStream: null, // used to hold local stream object to avoid recreating the stream everytime a new offer comes
      localStreamTemp: null,
      remoteStream: null, // used to hold remote stream object that is displayed in the main screen

      remoteStreams: [], // holds all Video Streams (all remote streams)
      peerConnections: {}, // holds all Peer Connections
      selectedVideo: null,

      status: "Please wait...",

      pc_config: {
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      },

      sdpConstraints: {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true,
        },
      },

      messages: [],
      sendChannels: [],
      requestUser: [],
      disconnected: false,

      localVideoMute: false,
      localMicMute: true,

      isMainRoom: false,
      fullScream: false,

      shareScream: false,
      allMuted: true,

      outEnable: false,
      paintScream: false,
      enableChat: true,

      normalUserChat: false,
    };
    this.socket = null;
  }

  getLocalStream = () => {
    // called when getUserMedia() successfully returns - see below
    // getUserMedia() returns a MediaStream object (https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
    // const success = (stream) => {
    // const video = document.querySelector('video');
    // const videoTracks = stream.getVideoTracks();
    // console.log('Got stream with constraints:', constraints);
    // console.log(`Using video device: ${videoTracks[0].label}`);
    // window.stream = stream; // make variable available to browser console
    // video.srcObject = stream;

    //   window.stream  = stream;
    //   // this.localVideoref.current.srcObject = stream
    //   // this.pc.addStream(stream);
    //   this.setState({
    //     localStream: stream,
    //   });

    //   this.whoisOnline();
    // };

    // // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    // // see the above link for more constraint options
    // const constraints =  window.constraints = {
    //   audio: true,
    //   video: true,
    //   // video: {
    //   //   width: 1280,
    //   //   height: 720
    //   // },
    //   // video: {
    //   //   width: { min: 1280 },
    //   // }
    //   // options: {
    //   //   mirror: true,
    //   // },
    // };

    const constraints = (window.constraints = {
      audio: true,
      video: true,
    });

    const handleSuccess = (stream) => {
      const video = document.querySelector("video");
      const videoTracks = stream.getVideoTracks();
      console.log("Got stream with constraints:", constraints);
      console.log(`Using video device: ${videoTracks[0].label}`);

      this.setState({
        localStream: stream,
      });
      this.whoisOnline();
      window.stream = stream; // make variable available to browser console
      video.srcObject = stream;
    };

    const handleError = (error) => {
      if (error.name === "ConstraintNotSatisfiedError") {
        const v = constraints.video;
        console.log(
          `The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`
        );
      } else if (error.name === "PermissionDeniedError") {
        console.log(
          "Permissions have not been granted to use your camera and " +
          "microphone, you need to allow the page access to your devices in " +
          "order for the demo to work."
        );
      }
      console.log(`getUserMedia error: ${error.name}`, error);
    };

    async function init(e) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
      } catch (e) {
        handleError(e);
      }
    }
    init();
  };

  whoisOnline = () => {
    // let all peers know I am joining
    this.sendToPeer("onlinePeers", null, {
      local: this.socket.id,
    });
  };

  sendToPeer = (messageType, payload, socketID) => {
    this.socket.emit(messageType, {
      socketID,
      payload,
    });
  };

  createPeerConnection = (socketID, callback) => {
    try {
      let pc = new RTCPeerConnection(this.state.pc_config);

      // add pc to peerConnections object
      const peerConnections = {
        ...this.state.peerConnections,
        [socketID]: pc,
      };
      this.setState({
        peerConnections,
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          this.sendToPeer("candidate", e.candidate, {
            local: this.socket.id,
            remote: socketID,
          });
        }
      };

      pc.oniceconnectionstatechange = (e) => {
        // if (pc.iceConnectionState === 'disconnected') {
        //   const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== socketID)
        //   this.setState({
        //     remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
        //   })
        // }
      };

      pc.ontrack = (e) => {
        let _remoteStream = null;
        let remoteStreams = this.state.remoteStreams;
        let remoteVideo = {};

        // 1. check if stream already exists in remoteStreams
        const rVideos = this.state.remoteStreams.filter(
          (stream) => stream.id === socketID
        );
        // 2. if it does exist then add track
        if (rVideos.length) {
          _remoteStream = rVideos[0].stream;
          _remoteStream.addTrack(e.track, _remoteStream);

          remoteVideo = {
            ...rVideos[0],
            stream: _remoteStream,
            // isHost: this.state.isMainRoom
          };
          remoteStreams = this.state.remoteStreams.map((_remoteVideo) => {
            return (
              (_remoteVideo.id === remoteVideo.id && remoteVideo) ||
              _remoteVideo
            );
          });
        } else {
          // 3. if not, then create new stream and add track
          _remoteStream = new MediaStream();
          _remoteStream.addTrack(e.track, _remoteStream);

          remoteVideo = {
            id: socketID,
            name: socketID,
            stream: _remoteStream,
            // isHost: this.state.isMainRoom
          };
          remoteStreams = [...this.state.remoteStreams, remoteVideo];
        }

        this.setState((prevState) => {
          // If we already have a stream in display let it stay the same, otherwise use the latest stream
          // const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: e.streams[0] }
          const remoteStream =
            prevState.remoteStreams.length > 0
              ? {}
              : {
                remoteStream: _remoteStream,
              };

          // get currently selected video
          // let selectedVideo = prevState.remoteStreams.filter(stream => stream.id === prevState.selectedVideo.id)
          let selectedVideo = prevState.remoteStreams[0]
            ? prevState.remoteStreams[0]
            : [];

          // if the video is still in the list, then do nothing, otherwise set to new video stream
          selectedVideo = selectedVideo.length
            ? {}
            : {
              selectedVideo: remoteVideo,
            };

          return {
            ...selectedVideo,
            ...remoteStream,
            remoteStreams,
          };
        });
      };
      pc.close = () => {
        // alert('GONE')
        console.log("pc closed");
      };

      if (this.state.localStream)
        // pc.addStream(this.state.localStream)
        this.state.localStream.getTracks().forEach((track) => {
          pc.addTrack(track, this.state.localStream);
        });
      // return pc
      callback(pc);
    } catch (e) {
      console.log("Something went wrong! pc not created!!", e);
      // return;
      callback(null);
    }
  };

  componentDidMount = () => {
    const { room, user } = qs.parse(window.location.search);
    this.socket = io.connect(`${process.env.REACT_APP_SERVER_API}/room`, {
      path: `/io/webrtc`,
      query: {
        room: room,
        username: user,
      },
    });
    window.onunload = window.onbeforeunload = function () {
      this.socket.close();
    };

    this.socket.on("connection-success", (data) => {
      this.getLocalStream();
      const status =
        data.peerCount > 1
          ? `Room : ${room}: ${data.peerCount}`
          : "기다리는 중..";
      const { isHost } = data;
      this.setState({
        status: status,
        isMainRoom: isHost,
        messages: data.messages,
      });
    });

    this.socket.on("joined-peers", (data) => {
      this.setState({
        status:
          data.peerCount > 1
            ? `Room : ${room}: ${data.peerCount}`
            : "기다리는 중..",
      });
    });

    // ************************************* //
    // ************************************* //

    this.socket.on("peer-disconnected", (data) => {
      // close peer-connection with this peer
      console.log(data.socketID);
      this.state.peerConnections[data.socketID].close();

      // get and stop remote audio and video tracks of the disconnected peer
      const rVideo = this.state.remoteStreams.filter(
        (stream) => stream.id === data.socketID
      );
      rVideo && this.stopTracks(rVideo[0].stream);

      // filter out the disconnected peer stream
      const remoteStreams = this.state.remoteStreams.filter(
        (stream) => stream.id !== data.socketID
      );

      this.setState((prevState) => {
        // check if disconnected peer is the selected video and if there still connected peers, then select the first
        const selectedVideo =
          prevState.selectedVideo.id === data.socketID && remoteStreams.length
            ? {
              selectedVideo: remoteStreams[0],
            }
            : null;

        return {
          // remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
          remoteStreams,
          ...selectedVideo,
          status:
            data.peerCount > 1
              ? `Room : ${room}: ${data.peerCount}`
              : "기다리는 중..",
        };
      });
    });

    // this.socket.on('offerOrAnswer', (sdp) => {

    //   this.textref.value = JSON.stringify(sdp)

    //   // set sdp as remote description
    //   this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    // })

    this.socket.on("online-peer", (socketID) => {
      // console.log('connected peers ...', socketID)

      // create and send offer to the peer (data.socketID)
      // 1. Create new pc
      this.createPeerConnection(socketID, (pc) => {
        // 2. Create Offer
        if (pc) {
          // Send Channel
          const handleSendChannelStatusChange = (event) => {
            console.log(
              "send channel status: " + this.state.sendChannels[0].readyState
            );
          };

          const sendChannel = pc.createDataChannel("sendChannel");
          sendChannel.onopen = handleSendChannelStatusChange;
          sendChannel.onclose = handleSendChannelStatusChange;

          this.setState((prevState) => {
            return {
              sendChannels: [...prevState.sendChannels, sendChannel],
            };
          });

          // Receive Channels
          const handleReceiveMessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("handleReceiveMessage", message);
            this.setState((prevState) => {
              return {
                messages: [...prevState.messages, message],
              };
            });
          };

          const handleReceiveChannelStatusChange = (event) => {
            if (this.receiveChannel) {
              console.log(
                "receive channel's status has changed to " +
                this.receiveChannel.readyState
              );
            }
          };

          const receiveChannelCallback = (event) => {
            const receiveChannel = event.channel;
            receiveChannel.onmessage = handleReceiveMessage;
            receiveChannel.onopen = handleReceiveChannelStatusChange;
            receiveChannel.onclose = handleReceiveChannelStatusChange;
          };

          pc.ondatachannel = receiveChannelCallback;

          pc.createOffer(this.state.sdpConstraints).then((sdp) => {
            pc.setLocalDescription(sdp);
            this.sendToPeer("offer", sdp, {
              local: this.socket.id,
              remote: socketID,
            });
          });
        }
      });
    });

    this.socket.on("offer", (data) => {
      this.createPeerConnection(data.socketID, (pc) => {
        pc.addStream(this.state.localStream);

        // Send Channel
        const handleSendChannelStatusChange = (event) => {
          // console.log('send channel status: ' + this.state.sendChannels[0].readyState)
        };

        const sendChannel = pc.createDataChannel("sendChannel");
        sendChannel.onopen = handleSendChannelStatusChange;
        sendChannel.onclose = handleSendChannelStatusChange;

        this.setState((prevState) => {
          return {
            sendChannels: [...prevState.sendChannels, sendChannel],
          };
        });

        // Receive Channels
        const handleReceiveMessage = (event) => {
          const message = JSON.parse(event.data);
          // console.log(message)
          this.setState((prevState) => {
            return {
              messages: [...prevState.messages, message],
            };
          });
        };

        const handleReceiveChannelStatusChange = (event) => {
          if (this.receiveChannel) {
            console.log(
              "receive channel's status has changed to " +
              this.receiveChannel.readyState
            );
          }
        };

        const receiveChannelCallback = (event) => {
          const receiveChannel = event.channel;
          receiveChannel.onmessage = handleReceiveMessage;
          receiveChannel.onopen = handleReceiveChannelStatusChange;
          receiveChannel.onclose = handleReceiveChannelStatusChange;
        };

        pc.ondatachannel = receiveChannelCallback;

        pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(
          () => {
            // 2. Create Answer
            pc.createAnswer(this.state.sdpConstraints).then((sdp) => {
              pc.setLocalDescription(sdp);

              this.sendToPeer("answer", sdp, {
                local: this.socket.id,
                remote: data.socketID,
              });
            });
          }
        );
      });
    });

    this.socket.on("answer", (data) => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID];
      // console.log(data.sdp)
      pc.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      ).then(() => { });
    });

    this.socket.on("candidate", (data) => {
      // get remote's peerConnection
      const pc = this.state.peerConnections[data.socketID];

      if (pc) pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    this.socket.on("request_mic_mute", (data) => {
        this.setState({localMicMute : !this.state.localMicMute})
      // get remote's peerConnection
    });

    // Host User
    this.socket.on("request_question", (data) => {
      const requestSocketId = data;
      let value = {
        type: "question",
        remoteId: requestSocketId,
        state: false
      }

      this.setState({
        requestUser: [...this.state.requestUser, value]
      })
    // get remote's peerConnection
    });

    //Host User
    this.socket.on("request_out", (data) => {
      const requestSocketId = data;
      let value = {
        type: "out",
        remoteId: requestSocketId,
        state: false
      }
      this.setState({
        requestUser: [...this.state.requestUser, value]
      })
    });

    // normal User reqest question
    this.socket.on("action_user_request_question", (data) => {
      data === 'reject' ?  this.setState({ localMicMute: true }) : this.setState({ localMicMute: false })
    })

    // normal User
    this.socket.on("action_user_request_out_normaluser", (data) => {
      data === 'reject' ?  this.setState({ outEnable: false }) : this.setState({ outEnable: true })
    })

    // host User
    this.socket.on("action_user_request_out_host", (data) => {
      const { type, remoteSocketId} = data;
      let requestUserTemp = [];
      if(type === 'accept'){
        requestUserTemp = this.state.requestUser.map(element => {
          if(element.remoteId === remoteSocketId){
            let elementTemp = {...element, state: true};
            return elementTemp;
          }else{
            return element
          }
        })
        console.log(requestUserTemp)
      }else{
        requestUserTemp = this.state.requestUser.filter(element => element.remoteId !== remoteSocketId);
      }
      this.setState({
        requestUser: requestUserTemp
      })
    })
    
    this.socket.on("action_host_request_cancel_out", (data) => {
      const remoteSocketId = data;
      let requestUserTemp = this.state.requestUser.filter(element => element.remoteId !== remoteSocketId);
      console.log(requestUserTemp)
      this.setState({
        requestUser: requestUserTemp
      })
    })
    this.socket.on("action_host_chat", (data) => {
      this.setState({
        normalUserChat: !this.state.normalUserChat
      })
    })
  };

  // ************************************* //
  // NOT REQUIRED
  // ************************************* //
  disconnectSocket = (socketToDisconnect) => {
    this.sendToPeer("socket-to-disconnect", null, {
      local: this.socket.id,
      remote: socketToDisconnect,
    });
  };

  switchVideo = (_video) => {
    // console.log(_video)
    this.setState({
      selectedVideo: _video,
    });
  };

  // ************************************* //
  // ************************************* //
  stopTracks = (stream) => {
    stream.getTracks().forEach((track) => track.stop());
  };

  handleMuteMic = () => {
    this.setState({
      localMicMute: !this.state.localMicMute,
    });
  };
  handleMuteVideo = () => {
    this.setState({
      localVideoMute: !this.state.localVideoMute,
    });
  };

  handleShareDisplayMedia = async () => {
    try {
      navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
          },
          audio: false,
        })
        .then((stream) => {
          this.setState({
            localStreamTemp : this.state.localStream,
            localStream: stream,
          });

          const { peerConnections, shareScream } = this.state;
          let videoTrack = stream.getVideoTracks()[0];
          Object.values(peerConnections).forEach((pc) => {
            var sender = pc.getSenders().find(function (s) {
              return s.track.kind == videoTrack.kind;
            });
            this.setState({
              shareScream: !shareScream,
            });
            sender.replaceTrack(videoTrack);
          })

          //화면 공유 중지
          const { localStreamTemp } = this.state;
          videoTrack.onended = () =>  {
            let videoTrack = localStreamTemp.getVideoTracks()[0];
            Object.values(peerConnections).forEach((pc) => {
              var sender = pc.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
              });
              sender.replaceTrack(videoTrack);
            })
            this.setState({
              localStream: localStreamTemp,
              shareScream: false
            });
          }
        });
    } catch (err) {
      console.error("Error: " + err);
    }
  };
  handleAllMuteMic = async () => {
    this.setState({
      allMuted: !this.state.allMuted
    })
    this.sendToPeer("allmute", null, {
      local: this.socket.id,
    });
  }
  // host user send server and check
  handleActionRequestUser = async (socketId, type, method) => {
    let requestUserTemp = [];
    if(type === 'accept'){
      requestUserTemp = this.state.requestUser.map(element => {
        if(element.remoteId === socketId){
          let elementTemp = {...element, state: true};
          return elementTemp;
        }else{
          return element
        }
      })
    }else{
      requestUserTemp = this.state.requestUser.filter(element => element.remoteId !== socketId);
    }

    this.setState({
      requestUser: requestUserTemp
    })
  
    this.sendToPeer("action_user_request", {type, method}, {
      remoteSocketId: socketId,
    });
  }
  //normal user 자리 취소 
  handleCancelOut = () => {
    this.sendToPeer("action_user_request_cancel_out", null , {
      local: this.socket.id,
    });
    this.setState({
      outEnable: !this.state.outEnable
    })
  } 

  //end to normal user
  handleRequestQuestion = async () => {
    // requestUserTemp = this.state.requestUser.filter(element => element.remoteId !== remoteSocketId);
    this.sendToPeer("request_question", null, {
      local: this.socket.id,
    });
  }
  handleRequestGoOut = async () => {
    this.sendToPeer("request_out", null, {
      local: this.socket.id,
    });
  }

  handlePaintScream = () => {
    this.setState({
      paintScream : !this.state.paintScream
    })
  }
  handleControlChat = () => {
    this.sendToPeer("action_host_chat", null, {
      local: this.socket.id,
    });
    this.setState({
      enableChat : !this.state.enableChat
    })
  }
  handleOutRoom = () => {
    const { remoteStreams } = this.state;
    if(remoteStreams.length !== 0){
      Alert({
          title: "수업을 종료하시겠습니까?",
          content: `핵생이 남아있는 경우, 모도 퇴장됩니다.`,
          handleClickAccept: () => { //accept
              this.setState({
                disconnected: true
              })
              this.props.history.push("/meetting");
          },
          handleClickReject: () => {} //reject 
      })
    }else{
      Alert({
        title: "수업을 종료하시겠습니까?",
        // content: `핵생이 남아있는 경우, 모도 퇴장됩니다.`,
        handleClickAccept: () => { //accept
            this.setState({
              disconnected: true
            })
            this.props.history.push("/meetting");
        },
        handleClickReject: () => {} //reject 
      })
    }
  }
  handleUserOutRoom = () => {
    Alert({
      title: "수업을 종료하시겠습니까?",
      // content: `핵생이 남아있는 경우, 모도 퇴장됩니다.`,
      handleClickAccept: () => { //accept
          this.setState({
            disconnected: true
          })
          this.props.history.push("/meetting");
      },
      handleClickReject: () => {} //reject 
    })
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
      shareScream
    } = this.state;
    if (disconnected) {
      // disconnect socket
      this.socket.close();
      // stop local audio & video tracks
      this.stopTracks(localStream);

      // stop all remote audio & video tracks
      remoteStreams.forEach((rVideo) => this.stopTracks(rVideo.stream));

      // stop all remote peerconnections
      peerConnections &&
        Object.values(peerConnections).forEach((pc) => pc.close());

      return <div> You have successfully Disconnected </div>;
    }

    const fullSize = !fullScream ? "85%" : "100%";

    return (
      <div className="room-page">
        <div className="room-page__left" style={{ width: fullSize }}>
          {
            isMainRoom ?
            (
                //Default scream & full scream
                <div className={!fullScream ? "left-top__defaultSize" : "left-top__fullSize"}>
                  <div className="out-full-btn">
                    <i className="material-icons out-btn" onClick={() => this.handleOutRoom()} >
                      exit_to_app
                    </i>
                    <i className="material-icons" onClick={() => this.setState({ fullScream: !this.state.fullScream })}>
                      {fullScream ? "fullscreen_exit" : "fullscreen"}
                    </i>
                  </div>
                  <div className="video-task-btn">
                    <i className="material-icons" onClick={() => this.handleAllMuteMic()} style={!allMuted ? { color: "red" } : {}}> {!allMuted ? "volume_off" : "volume_up"} </i>
                    <i className="material-icons" onClick={() => this.handleMuteMic()} style={localMicMute ? { color: "red" } : {}}>
                      {!localMicMute ? "mic" : "mic_off"}
                    </i>
                    <i className="material-icons" onClick={() => this.handleMuteVideo()} style={localVideoMute ? { color: "red" } : {}}>
                      {(!localVideoMute && "videocam") || "videocam_off"}
                    </i>
                  </div>
                  <div className="point-btn">
                    <i className="material-icons" onClick={() => this.handleControlChat()} style={enableChat ? {} : {color: "red" }}>
                      {enableChat ? "speaker_notes" : "speaker_notes_off"}
                    </i>
                    <i className="material-icons" onClick={() => this.handleShareDisplayMedia()} style={shareScream ? {color: "red" } : {}}>
                      laptop
                    </i>
                    <i className="material-icons" onClick={() => this.handlePaintScream()} style={paintScream ? { color: "red" } : {}}>
                      dvr
                    </i>
                  </div>
                </div>
              ) :
              <div  className="left-normaluser">
                {
                  outEnable && 
                  <>
                  <p> 자리 비움 요청이 수락됩니다. </p>
                  <button onClick={() => this.handleCancelOut()}>자리 비움이 최소</button> 
                  </>
                  || !localMicMute &&
                    <>
                      <p>마이크 요청이 수락됩니다.</p>
                      <p><i className="material-icons" >mic</i></p>
                    </>
                }
              </div>
            }
          <div className="left-content">
            {
            paintScream ? 
            <WhiteBoard />
            :
            <LeftContentContainer
              paintScream={!paintScream}
              switchVideo={this.switchVideo}
              remoteStreams={remoteStreams}
              isMainRoom={isMainRoom}

              requestUser={requestUser}
              handleActionRequestUser={this.handleActionRequestUser}

              //handle for normal user
              handleUserOutRoom = {this.handleUserOutRoom}
              handleRequestQuestion={this.handleRequestQuestion}
              handleRequestGoOut={this.handleRequestGoOut}
              videoStream={this.state.selectedVideo && this.state.selectedVideo.stream}
            />
            }
          </div>
        </div>

        {
          !fullScream && (
            <div className="room-page__right">
              <div className="wrapper-localVideo">
                <Video
                  videoType="localVideo"
                  videoStyles={{
                    width: "100%",
                    height: "100%",
                  }}
                  frameStyle={{
                    height: "100%",
                    borderRadius: 5,
                    backgroundColor: "black",
                  }}
                  localMicMute={localMicMute}
                  localVideoMute={localVideoMute}
                  videoStream={localStream}
                  autoPlay
                  muted={localMicMute}
                ></Video>
              </div>
              <div className="wrapper-localChatting">
                <Chat
                  normalUserChat={isMainRoom ? false : normalUserChat}
                  user={{
                    uid: (this.socket && this.socket.id) || "",
                  }}
                  messages={messages}
                  sendMessage={(message) => {
                    this.setState((prevState) => {
                      return {
                        messages: [...prevState.messages, message],
                      };
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
          )}
      </div>
    );
  }
}

export default Room;
