import React, { useState } from 'react'
import './style.scss'
import axios from 'axios'

function CreateRoom(props) {
    const [roomname, setRoomName] = useState("");
    const [username, setUserName] = useState("");

    const [joinroom, setJoinRoom] = useState("");
    const [joinUsername, setJoinUsername] = useState("");
 
    const [searchUsername, setSearchUsername] = useState("");
    const [roomsByUsername, setRoomsByUserName] = useState([]);

    const [timeTest, setTimeTest] = useState();
    const handleCreateRoom = () => {
        try {
            axios({
                method: 'post',
                url: `${process.env.REACT_APP_SERVER_API}/room/createroom`,
                data: {
                    roomname, username
                }
            }).then(res => {
                const { data } = res;
                const { result, message } = data;
                if(result){
                    const { roomname : room } = data.data[0];
                    localStorage.setItem("hostRoom",true)
                    props.history.push(`/meetting/open?room=${room}&user=${username}`)
                }else{
                    alert(message)
                }
            }).catch(error => console.log(error))
            // props.history.push(`/meetting/open?room=${roomname}&user=${username}`)
        } catch (error) {
            console.log(error)            
        }
    }
    const handleSearchRoomByUserName = () => {
        try {
            axios({
                method: 'get',
                url: `${process.env.REACT_APP_SERVER_API}/room/search`,
                params: {
                    username: searchUsername
                }
            }).then(res => {
                const { data } = res;
                setRoomsByUserName(data.data)
            }).catch(error => console.log(error))
        } catch (error) {
            console.log(error)            
        }
    }
    const handleJoinRoom = () => {
        axios({
            method: 'get',
            url: `${process.env.REACT_APP_SERVER_API}/room/joinroomcheck`,
            params: {
                roomname: joinroom
            }
        }).then(res => {
            const { data } = res;
            const { result } = data;
            if(result){
                alert("해당하는 방이 생성되지 않습니다.")                
            }else{
                props.history.push(`/meetting/open?room=${joinroom}&user=${joinUsername}`)
            }
            // setRoomsByUserName(data.data)
        }).catch(error => console.log(error))
    }
    const handleSetTime = (e) => {
        localStorage.setItem("time", e.target.value)
    }
    return (
        <div className="create-room">
            <div className="create-room-container">
                <h4>Lecture planet WEB-RTC Project v.1</h4>
                <div>
                    <div className="create-room-made">
                        <input type="text" name="" placeholder="강좌 이름 ... " id="" onChange={(e) => setRoomName(e.target.value)} value={roomname}/>
                        <input type="text" name="" placeholder="사용자 이름 ..." id="" onChange={(e) => setUserName(e.target.value)}  value={username} />
                        <input type="text" name="" placeholder="집중도 테스트 시간 ... 분" id="" onChange={(e) => handleSetTime(e)} value={timeTest}/>
                        <button style={{width: '150px'}} onClick={() => handleCreateRoom()}>강좌 생성하기</button>
                    </div>

                    <div className="create-room-join">.
                        <input type="text" name="" placeholder="강좌 이름 ... " id="" onChange={(e) => setJoinRoom(e.target.value)} value={joinroom}/>
                        <input type="text" name="" placeholder="사용자 이름 ... " id="" onChange={(e) => setJoinUsername(e.target.value)} value={joinUsername}/>
                        <button style={{width: '150px'}} onClick={() => handleJoinRoom()}>강좌 참여하기</button>
                    </div>

                </div>
            </div>


            {/* <div className="create-room-search">
                <input type="text" name="" placeholder="룸 이름 ... " id="" onChange={(e) => setSearchUsername(e.target.value)} value={searchUsername}/>
                <button style={{width: '150px'}} onClick={() => !searchUsername ? alert("원하는 방을 입력하세요")  : handleSearchRoomByUserName() }>Search Room</button>
            </div>
            {
                roomsByUsername.length !== 0 &&
                <ul>
                    {
                        roomsByUsername.map((item, idx) => <li  style={{cursor: 'pointer'}} key ={idx} onClick={() => props.history.push(`/meetting/open?room=${item.roomname}&user=${item.username}`)}>{item.roomname}</li>)
                    }
                </ul>
            } */}
        </div>
    )
}



export default CreateRoom

