import React, { useEffect, useState } from 'react'
import './style.scss'
import qs from 'query-string'
import io from 'socket.io-client'
import Video from '../../components/Video'
import Videos from '../../components/LeftContentContainer'
import Chat from '../../components/Chat'
import Draggable from '../../components/Draggable'


let socket = null
function Room(props) {
  const [roomname, setRoomName] = useState("")

  //localStream - used to hold local stream object to avoid recreating the stream every time a new offer comes
  const [localStream, setLocalStream] = useState(null)

  //remoteStream - used to hold remote stream object that is displayed in the main screen
  const [remoteStream, setRemoteStream] = useState(null)

  //remotes Streams - holds all Video Streams (all remote streams)
  const [listRemoteStreams, setListRemoteStreams] = useState([])

  //peerConnection - holds all Peer Connection
  const [peerConnections, setPeerConnections] = useState({})

  //selected Video - handle click zoom video
  const [selectedVideo, setSelectedVideo] = useState(null)

  //text status 
  const [status, setStatus] = useState("Please wait...")

  //List messages
  const [messages, setMessages] = useState([])

  //Send Channels
  const [sendChannels, setSendChannels] = useState([])

  //Dis connect status
  const [disconnected, setDisconnected] = useState(false)


  //STUN config value
  const [pcConfig, setPCConfig] = useState({
    "iceServers": [
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  })

  //SDP protocol default
  const [sdpConstraints, setSdpConstraints] = useState({
    'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true
    }
  })

  //로컬 Stream를 오픈
  const getLocalStream = () => {

    const success = (stream) => {
      window.localStream = stream
      setLocalStream(stream)

      //현재 User를 체크함
      whoIsOnline()
    }

    const failure = (e) => {
      console.log("getUserMedia error, not support: ", e)
    }


    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    // 필요하는 옵션을 설정
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

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => success(stream))
      .catch((err) => failure(err))
  }

  // 자기 SocketId를 보내서 같은 연결한 Socket를 조회
  const whoIsOnline = () => {
    sendToPeer('onlinePeers', null, { local: socket.id })
  }

  // 원하는 Socket Type를, 데이터 및 Socket Id를 전송
  const sendToPeer = (messageType, payload, socketID) => {
    socket.emit(messageType, {
      socketID,
      payload
    })
  }

  //Create Peer Connection
  const createPeerConnection = (socketID, callback) => {
    try {

      // Peer Connection를 생성함(pcConfig)
      let rtcPeerConnection = new RTCPeerConnection(pcConfig)
      // 새로운 Peer Connection를 추가함
      const _peerConnections = {...peerConnections, [socketID]: rtcPeerConnection }
      console.log("Peer connection", _peerConnections)
      setPeerConnections(_peerConnections)

      //handler for icecandidate events to send the candidates to the remote peer
      rtcPeerConnection.onicecandidate = (event) => {

        //! ontrack 이벤트를 발생할때 연결된 Peer를 candidate를 전송
        // Send the candidate to the remote peer
        if (event.candidate) {
          sendToPeer('candidate', event.candidate, {
            local: socket.id,
            remote: socketID
          })
        }
      }

      rtcPeerConnection.onconnectionstatechange = (event) => {
        // if (pc.iceConnectionState === 'disconnected') {
        //   const remoteStreams = this.state.remoteStreams.filter(stream => stream.id !== socketID)

        //   this.setState({
        //     remoteStream: remoteStreams.length > 0 && remoteStreams[0].stream || null,
        //   })
        // }
      }

      // The function receives as input the event object, of type RTCTrackEvent; 
      // this event is sent when a new incoming MediaStreamTrack has been created and associated with an RTCRtpReceiver 
      // object which has been added to the set of receivers on connection.

      //! B Peer가 Offer를 받을때 발생하는 이벤트 => 동시에 A Peer를 onicecandidate를 발생
      rtcPeerConnection.ontrack = (event) => {

        let _remoteStream = null
        let _listRemoteStreams = [...listRemoteStreams] 
        let remoteVideo = {}

        //1. check if stream already exists in remoteStreams
        //! addTrack를 하기 위해서 현재 Stream 체크함
        //! 다른 유저에게 전송될 트랙들의 묶음에 신규 미디어 트랙을 추가
        const rVideos = listRemoteStreams.filter(stream => stream.id == socketID)
        console.log("Check Value", rVideos)

        //2. if it exist then add track
        //! Video를 존재함
        if (rVideos.length) {
          _remoteStream = rVideos[0].stream
          _remoteStream.addTrack(event.track, _remoteStream)

          //current remoteVideo
          remoteVideo = {
            ...rVideos[0],
            stream: _remoteStream,
          }

          _listRemoteStreams = listRemoteStreams.map(_remoteVideo => {
            return _remoteVideo.id === remoteVideo.id && remoteVideo || _remoteVideo
          })

        } else {
          //3.if not, then create new stream and add track
          //! 아무 Track가 존재하지 않음
          _remoteStream = new MediaStream()
          _remoteStream.addTrack(event.track, _remoteStream)

          //current remoteVideo
          remoteVideo = {
            id: socketID,
            name: socketID,
            stream: _remoteStream,
          }

          //add remote Video
          _listRemoteStreams = [...listRemoteStreams, remoteVideo]
        }

        const checkAndSetRemoteStream = () => {

          // If we already have a stream in display let it stay the same, otherwise use the latest stream
          // const remoteStream = prevState.remoteStreams.length > 0 ? {} : { remoteStream: e.streams[0] }

          //! 처음에 연결한 Peer가 없을때
          const _remoteStream = listRemoteStreams.length > 0 ? {} : { remoteStream: _remoteStream }
          
          // get Currently selected Video
          let _selectedVideo = listRemoteStreams.filter(stream => stream.id === selectedVideo.id)
          
          // if the video is still in the list, then do nothing, otherwise set to new video stream
          //! 현재 화면에 출력되는 Stream를 나갈떄 이벤트를 처리
          _selectedVideo = _selectedVideo.length ? {} : { selectedVideo: remoteVideo }

          setSelectedVideo(..._selectedVideo)
          setRemoteStream(..._remoteStream)
          setListRemoteStreams(_listRemoteStreams)
        }
        checkAndSetRemoteStream();
      }

      rtcPeerConnection.close = () => {
        console.log("Peer connection closed")
      }
      if (localStream) {
        localStream.getTracks().forEach(track => {
          rtcPeerConnection.addTrack(track, localStream)
        })
      }
      // return rtcPeerConnection
      callback(rtcPeerConnection)

    } catch (error) {
      console.log("Something went wrong! PeerConnection not created !!!", error)
      callback(null)
    }
  }

  useEffect(() => {

    //create socket client
    socket = io.connect(
      `${process.env.REACT_APP_SERVER_API}/room`,
      {
        path: `/io/webrtc`,
        query: {
          room: 'checkroom' //변수를 받아서 Socket를 그룹을 나눔
        }
      }
    )
    console.log(socket)
    //! 처음에 접근할떄 LocalStream를 출력함
    socket.on('connection-success', data => {
      getLocalStream()
      const status = data.peerCount > 1 ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}` : 'Waiting for other peers to connect'
      setStatus(status)
      setMessages(data.messages) //만약에 보낸 메시지를 있으면 출력함
    })

    // Peer Joined를 Peer의 계수를 출력함
    socket.on('joined-peers', data => {
      const status = data.peerCount > 1 ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}` : 'Waiting for other peers to connect'
      setStatus(status)
    })


    // ************************************* Disconnection *************************************//
    socket.on('peer-disconnected', data => {

      // close peer-connection with this peer
      peerConnections[data.socketID].close()

      // get and stop remote audio and video tracks of the disconnected peer
      // 여상 Track를 종료
      const rVideo = listRemoteStreams.filter(stream => stream.id === data.socketID)
      rVideo && stopTracks(rVideo[0].stream)

      // filter out the disconnected peer stream
      const _listRemoteStreams = listRemoteStreams.filter(stream => stream.id !== data.socketID)

      // check disconnection and set status
      const checkAndResetDisconnection = () => {
        const _selectedVideo = selectedVideo.id === data.socketID && _listRemoteStreams.length ? { selectedVideo: _listRemoteStreams[0] } : null
        
        //!Select Video를 체크하고 Remote 리스트를 다시 설정
        setListRemoteStreams(_listRemoteStreams)
        setSelectedVideo(..._selectedVideo)

        //!현재 접근한 Peer를 설정
        const status = data.peerCount > 1 ? `Total Connected Peers to room ${window.location.pathname}: ${data.peerCount}` : 'Waiting for other peers to connect'
        setStatus(status)
      }
      checkAndResetDisconnection()
    })


    socket.on('online-peer', socketID => {
      // create and send offer to the peer (data.socketID)

      // 1. Create new pc - callback
      createPeerConnection(socketID, _peerConnection => {

        console.log("oneline peerrr", socketID, _peerConnection)
        // 2. create Offer
        if (_peerConnection) {

          //! 메시지를 보내기 위해서 Channel를 체크함
          // Send Channel 체크함
          const handleSendChannelStatusChange = () => {
            console.log('send channel status: ' + sendChannels[0].readyState)
          }

          const sendChannel = _peerConnection.createDataChannel('sendChannel')
          sendChannel.onopen = handleSendChannelStatusChange
          sendChannel.onclose = handleSendChannelStatusChange

          // SendChannel를 만들어서 추가함
          setSendChannels([...sendChannels, sendChannel])

          // Receive Channels
          const handleReceiveMessage = (event) => {
            const message = JSON.parse(event.data)
            setMessages([...messages, message])
          }

          const handleReceiveChannelStatusChange = () => {
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

          // opdata channel
          _peerConnection.ondatachannel = receiveChannelCallback

          //! Offer를 만들어서 다른 Peer를 추가함
    
          _peerConnection.createOffer(sdpConstraints)
            .then(sdp => {
              _peerConnection.setLocalDescription(sdp)

              console.log("send Offer", sdp)
              sendToPeer('offer', sdp, {
                local: socket.id,
                remote: socketID
              })
            })
        }
      })
    })

    //! Offer event를 Socket를 듣고 추가함
    //! 여기서도 Channel를 추가함
    socket.on('offer', data => {
      createPeerConnection(data.socketID, _peerConnection => {
        console.log("Offer Socket", data.socketID, _peerConnection)
        _peerConnection.addStream(localStream)

        // Send Channel
        const handleSendChannelStatusChange = () => {
          console.log('send channel status: ' + sendChannels[0].readyState)
        }

        const sendChannel = _peerConnection.createDataChannel('sendChannel')
        sendChannel.onopen = handleSendChannelStatusChange
        sendChannel.onclose = handleSendChannelStatusChange

        setSendChannels([...sendChannels, sendChannel])

        // Receive Channels
        const handleReceiveMessage = (event) => {
          const message = JSON.parse(event.data)
          setMessages([...messages, message])
        }

        const handleReceiveChannelStatusChange = () => {
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

        _peerConnection.ondatachannel = receiveChannelCallback

        //! Set Remote Peer를 한 후에 응답함
        _peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {
          // 2. Create Answer
          _peerConnection.createAnswer(sdpConstraints)
            .then(sdp => {
              _peerConnection.setLocalDescription(sdp)
              sendToPeer('answer', sdp, {
                local: socket.id,
                remote: data.socketID
              })
            })
        })
      })
    })

    //! 응답을 듣고 Peer를 추가함
    socket.on('answer', data => {
      try {
        // get remote's peerConnection
        const _peerConnection = peerConnections[data.socketID]
        alert("aaa")
        console.log("ANSWER AAAAAAAAA", data.sdp)
        console.log("ANSWER aaaa", peerConnections)
        console.log("ANSWER ccccc", _peerConnection)
        _peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {})
      } catch (error) {
        console.log(error)
        alert("bbb")        
      }
    })

    //! Candidate를 듣고 추가함
    //! A먼저 Candidate를 보냄, B를 받아서 ...send Candidate // onTrack 동시 실행
    socket.on('candidate', (data) => {
      // get remote's peerConnection
      const _peerConnection = peerConnections[data.socketID]
      if (_peerConnection)
      _peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
    })


    
    
  }, [])
  
  // ***************** Video Tasks ******************** //
  const switchVideo = (_video) => {
    setSelectedVideo(_video)
  }

  const stopTracks = (stream) => {
    stream.getTracks().forEach(track => track.stop())
  }
  


  if (disconnected) {
    // disconnect socket
    socket.close()
    // stop local audio & video tracks
    stopTracks(localStream)

    // stop all remote audio & video tracks
    listRemoteStreams.forEach(rVideo => stopTracks(rVideo.stream))

    // stop all remote peerconnections
    peerConnections && Object.values(peerConnections).forEach(pc => pc.close())

    return (<div>미팅 정상적으로 종료되었습니다. 감사합니다</div>)
  }

  const statusText = <div style={{ color: 'yellow', padding: 5 }}>{status}</div>

  return (
    <div>
    <Draggable style={{
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
    </Draggable>
    <br />
      <div style={{
        zIndex: 3,
        position: 'absolute',
        // margin: 10,
        // backgroundColor: '#cdc4ff4f',
        // padding: 10,
        // borderRadius: 5,
      }}>
        <i onClick={(e) => {setDisconnected(true)}} style={{ cursor: 'pointer', paddingLeft: 15, color: 'red' }} class='material-icons'>highlight_off</i>
        <div style={{
          margin: 10,
          backgroundColor: '#cdc4ff4f',
          padding: 10,
          borderRadius: 5,
          background: 'red'
        }}>{ statusText }</div>
      </div>
      <div>
        <Videos
          switchVideo={switchVideo}
          remoteStreams={listRemoteStreams}
          // videoStream={this.state.selectedVideo && this.state.selectedVideo.stream}
        ></Videos>
      </div>
      <br />

      <Chat
          user={{
            uid: socket && socket.id || ''
        }}
        messages={messages}
        sendMessage={(message) => {
          setMessages([...messages, message])
          sendChannels.map(sendChannel => {
            sendChannel.readyState === 'open' && sendChannel.send(JSON.stringify(message))
          })
          sendToPeer('new-message', JSON.stringify(message), {local: socket.id})
        }}
      />

      {/* <div style={{zIndex: 1, position: 'fixed'}} >
        <button onClick={this.createOffer}>Offer</button>
        <button onClick={this.createAnswer}>Answer</button>

        <br />
        <textarea style={{ width: 450, height:40 }} ref={ref => { this.textref = ref }} />
      </div> */}
      {/* <br />
      <button onClick={this.setRemoteDescription}>Set Remote Desc</button>
      <button onClick={this.addCandidate}>Add Candidate</button> */}
    </div>
    // <div className="room">
    //   <div className="room-content">
    //     <div className="room-content__tasks">
    //       <Video
    //         videoType='localVideo'
    //         videoStyles={{
    //           // zIndex:2,
    //           // position: 'absolute',
    //           // right:0,
    //           width: 200,
    //           // height: 200,
    //           // margin: 5,
    //           // backgroundColor: 'black'
    //         }}
    //         frameStyle={{
    //           width: 200,
    //           margin: 5,
    //           borderRadius: 5,
    //           backgroundColor: 'black',
    //         }}
    //         showMuteControls={true}
    //         // ref={this.localVideoref}
    //         videoStream={localStream}
    //         autoPlay muted>
    //       </Video>
    //     </div>

    //     <div style={{
    //       zIndex: 3,
    //       position: 'absolute',
    //       // margin: 10,
    //       // backgroundColor: '#cdc4ff4f',
    //       // padding: 10,
    //       // borderRadius: 5,
    //     }}>
    //       <i onClick={(e) => setDisconnected(true)} style={{ cursor: 'pointer', paddingLeft: 15, color: 'red' }} class='material-icons'>highlight_off</i>
    //       <div style={{
    //         margin: 10,
    //         backgroundColor: '#cdc4ff4f',
    //         padding: 10,
    //         borderRadius: 5,
    //         background: 'red'
    //       }}>{statusText}</div>
    //     </div>

    //     <div>
    //       <Videos
    //         switchVideo={switchVideo}
    //         remoteStreams={remoteStreams}
    //       // videoStream={this.state.selectedVideo && this.state.selectedVideo.stream}
    //       ></Videos>
    //     </div>

    //     <Chat
    //       user={{
    //         uid: this.socket && this.socket.id || ''
    //       }}
    //       messages={messages}
    //       sendMessage={(message) => {
    //         this.setState(prevState => {
    //           return { messages: [...prevState.messages, message] }
    //         })
    //         this.state.sendChannels.map(sendChannel => {
    //           sendChannel.readyState === 'open' && sendChannel.send(JSON.stringify(message))
    //         })
    //         this.sendToPeer('new-message', JSON.stringify(message), { local: this.socket.id })
    //       }}
    //     />

    //     {/* </div>
    //     <div className="room-content__videos">
    //       {statusText}
    //     </div>
    //   </div>
    //   <div className="room-chat">
    //     Room Chat
    //         </div> */}
    //   </div>
    // </div>
  )
}


export default Room

