import React, { useEffect, useState } from "react"
import "./style.scss"
import axios from "axios"
import { useDispatch, useSelector } from "react-redux"

import actions from '../../features/AuthFeature/action';
import selectors from '../../features/AuthFeature/selector';
function CreateRoom(props) {
  const [key, setKey] = useState("BNrDBCr81Om9akb3TBq9wSmFLILaA8XGueQXhAiM")
  const [type, setType] = useState("json")
  const [userIdx, setUserIdx] = useState(6)
  const [scCode, setScCode] = useState("J10")
  const [schulCode, setSchulCode] = useState(122)
  const [lecIdx, setLecIdx] = useState(25)

  // const [joinroom, setJoinRoom] = useState("")
  // const [joinUsername, setJoinUsername] = useState("")



  const [timeTest, setTimeTest] = useState()
  // const handleCreateRoom = () => {
  //   try {
  //     axios({
  //       method: "post",
  //       url: `${process.env.REACT_APP_SERVER_API}/room`,
  //       data: {
  //         roomname,
  //         username
  //       }
  //     })
  //       .then(res => {
  //         const { data } = res
  //         const { result, message } = data
  //         if (result) {
  //           const { roomname: room } = data.data[0]
  //           localStorage.setItem("hostRoom", true)
  //           props.history.push(`/meetting/open?room=${room}&user=${username}`)
  //         } else {
  //           alert(message)
  //         }
  //       })
  //       .catch(error => console.log(error))
  //     // props.history.push(`/meetting/open?room=${roomname}&user=${username}`)
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  // const handleJoinRoom = () => {
  //   if(joinroom){
  //     let params = { roomname: joinroom }
  //     dispatch(actions.joinRoom(params))
  //   }else{
  //     alert("참여할 강좌를 입력하세요")
  //   }
  // }
  // const handleSetTime = e => {
  //   localStorage.setItem("time", e.target.value)
  // }
  const dispatch = useDispatch();

  const signinLoading = useSelector(selectors.selectSigninLoading);
  const initLoading = useSelector(selectors.selectInitLoading)

  const handleCreateRoom = () => {
    try {
      axios({
        method: "post",
        url: `${process.env.REACT_APP_SERVER_API}/lms`,
        data: {
          key,
          type,
          user_idx: userIdx,
          sc_code: scCode,
          schul_code: schulCode,
          lec_idx: lecIdx
        }
      })
        .then(res => {
          console.log(res)
        })
        .catch(error => console.log(error))
      // props.history.push(`/meetting/open?room=${roomname}&user=${username}`)
    } catch (error) {
      console.log(error)
    }
  };

  useEffect(() => {
    dispatch(actions.doInitLoadingDone());
  }, [])


  return (
    <div className="create-room">
      <div className="create-room-container">
        <h4 style={{ marginBottom: "15px" }}>
          Lecture planet WEB-RTC Project v.1
        </h4>
        <div>
          <div className="create-room-made">
            <h4>강사 입장</h4>
            <input
              type="text"
              name=""
              placeholder="Key ... "
              id=""
              onChange={e => setKey(e.target.value)}
              value={key}
            />
            <input
              type="text"
              name=""
              placeholder="Type ..."
              id=""
              onChange={e => setType(e.target.value)}
              value={type}
            />
            <input
              type="text"
              name=""
              placeholder="User Idx ..."
              id=""
              onChange={e => setUserIdx(e.target.value)}
              value={userIdx}
            />

            <input
              type="text"
              name=""
              placeholder="Sc_code"
              id=""
              onChange={e => setScCode(e.target.value)}
              value={scCode}
            />

            <input
              type="text"
              name=""
              placeholder="Schul_code"
              id=""
              onChange={e => setSchulCode(e.target.value)}
              value={schulCode}
            />

            <input
              type="text"
              name=""
              placeholder="Schul_code"
              id=""
              onChange={e => setSchulCode(e.target.value)}
              value={schulCode}
            />
            <input
              type="text"
              name=""
              placeholder="Lec Ide"
              id=""
              onChange={e => setLecIdx(e.target.value)}
              value={lecIdx}
            />

            
            {/* <input
              type="text"
              name=""
              placeholder="집중도 테스트 시간 ... 분"
              id=""
              onChange={e => handleSetTime(e)}
              value={timeTest}
            /> */}
            <button
              style={{ width: "150px" }}
              onClick={() => handleCreateRoom()}
            >
              강좌 생성하기
            </button>
          </div>

          {/* <div className="create-room-join">
            <h4>학생 입장</h4>
            <input
              type="text"
              name=""
              placeholder="강좌 이름 ... "
              id=""
              onChange={e => setJoinRoom(e.target.value)}
              value={joinroom}
            />
            <button style={{ width: "150px" }} onClick={() => handleJoinRoom()}>
              강좌 참여하기
            </button>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default CreateRoom
