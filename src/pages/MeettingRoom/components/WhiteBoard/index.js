import React, { useEffect, useLayoutEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../../../../constants/icons'
import rough from "roughjs/bundled/rough.esm";
import html2canvas from 'html2canvas';
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

