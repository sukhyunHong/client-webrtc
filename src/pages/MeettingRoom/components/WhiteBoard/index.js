import React from 'react'
import './style.scss'


import Tools from './components/Tools';
import WhiteBoard from './components/WhiteBoard';



function WhiteBoardContainer(props) {
  return (
    <div className="paint-wrapper">
      <div id="whiteBoard" className="paint-wrapper__container">
        <div id="main">
          <div id="container">
            <Tools/>
            <WhiteBoard/>
          </div>
        </div>
      </div>
    </div>
  )
}



export default WhiteBoardContainer

