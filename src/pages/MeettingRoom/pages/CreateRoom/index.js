import React, { useState } from 'react'
import './style.scss'
import axios from 'axios'

function CreateARoom(props) {
    const [roomname, setRoomName] = useState("");
    const [username, setUserName] = useState("");

    const [joinroom, setJoinRoom] = useState("");
    const [joinUsername, setJoinUsername] = useState("");
 
    const [searchUsername, setSearchUsername] = useState("");
    const [roomsByUsername, setRoomsByUserName] = useState([]);
    const handleCreateRoom = () => {
        try {
            // axios({
            //     method: 'post',
            //     url: `${process.env.REACT_APP_SERVER_API}/room/createroom`,
            //     data: {
            //         roomname, username
            //     }
            // }).then(res => {
            //     const { data } = res;
            //     const { result, message } = data
            //     if(result){
            //         const { roomname : room } = data.data[0];
            //     }else{
            //         alert(message)
            //     }
            // }).catch(error => console.log(error))
            props.history.push(`/meetting/open?room=${roomname}&user=${username}`)
        } catch (error) {
            console.log(error)            
        }
    }
    const handleSearchRoomByUserName = () => {
        try {
            console.log(process.env.REACT_APP_SERVER_API)
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
    return (
        <div className="create-room">
            <div>
                <input type="text" name="" placeholder="Room Name ... " id="" onChange={(e) => setRoomName(e.target.value)} value={roomname}/>
                <input type="text" name="" placeholder="User Name ..." id="" onChange={(e) => setUserName(e.target.value)}  value={username} />
                <button style={{width: '150px'}} onClick={() => handleCreateRoom()}>Create Room</button>
            </div>

            <div>
                <input type="text" name="" placeholder="Room Join ... " id="" onChange={(e) => setJoinRoom(e.target.value)} value={joinroom}/>
                <input type="text" name="" placeholder="User Join ... " id="" onChange={(e) => setJoinUsername(e.target.value)} value={joinUsername}/>
                <button style={{width: '150px'}} onClick={() => !joinroom ? alert("원하는 방을 입력하세요")  : props.history.push(`/meetting/open?room=${joinroom}&user=${joinUsername}`) }>Join Room</button>
            </div>

            <div>
                <input type="text" name="" placeholder="Search room by username ... " id="" onChange={(e) => setSearchUsername(e.target.value)} value={searchUsername}/>
                <button style={{width: '150px'}} onClick={() => !searchUsername ? alert("원하는 방을 입력하세요")  : handleSearchRoomByUserName() }>Search Room</button>
            </div>
            {
                roomsByUsername.length !== 0 &&
                <ul>
                    {
                        roomsByUsername.map((item, idx) => <li  style={{cursor: 'pointer'}} key ={idx} onClick={() => props.history.push(`/meetting/open?room=${item.roomname}&user=${item.username}`)}>{item.roomname}</li>)
                    }
                </ul>
            }
        </div>
    )
}



export default CreateARoom

