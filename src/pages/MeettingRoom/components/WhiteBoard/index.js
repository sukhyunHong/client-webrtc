import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import './style.scss'

function WhiteBoard(props) {

  useEffect(() => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const range = document.getElementById("jsRange");
    const mode = document.getElementById("jsMode");
    const erase = document.getElementById("jsErase");
    const redpen = document.getElementById("redpen");
    const reset = document.getElementById("reset");
    
    canvas.width = 1740;
    canvas.height = 930;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    ctx.strokeStyle = valueSelectColor;
    ctx.lineWidth = 2.5;
  
    let painting = false;
    let filling = false;
  
    const stopPainting = () => {
      painting = false;
    };
  
    const onMouseMove = e => {
      const x = e.offsetX;
      const y = e.offsetY;
      ctx.strokeStyle = valueSelectColor;
      if (!painting) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    };
  
    const startPainting = () => {
      painting = true;
    };
    const handleCanvasClick = () => {
    };
    const handleCM = e => {
      e.preventDefault();
    };
  
    if (canvas) {
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mousedown", startPainting);
      canvas.addEventListener("mouseup", stopPainting);
      canvas.addEventListener("mouseleave", stopPainting);
      canvas.addEventListener("click", handleCanvasClick);
      canvas.addEventListener("contextmenu", handleCM);
    }
  
    const handleRangeChange = e => {
      const brushWidth = e.target.value;
      ctx.lineWidth = brushWidth;
    };
  
    if (range) {
      range.addEventListener("input", handleRangeChange);
    }
  
    //Paint 클릭 시
    const handleModeClick = e => {
      console.log("asa")
      painting = false;
      ctx.strokeStyle = valueSelectColor;
      filling = false;
    };
    //Redpen 클릭 시
    const handleRedPen = e => {
      painting = false;
      ctx.strokeStyle = valueSelectColor;
      filling = false;
    }
    //Erase 클릭 시
    const handleEraseClick = e => {
      painting = false;
      ctx.strokeStyle = "white";
      filling = false;
    };

    const handleReset = e => {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (mode) {
      mode.addEventListener("click", handleModeClick);
    }
    if (erase) {
      erase.addEventListener("click", handleEraseClick);
    }
    if (redpen) {
      redpen.addEventListener("click", handleRedPen);
    }
    if (reset) {
      reset.addEventListener("click", handleReset);
    }

  }, [])

  const [value, setValue]  = useState(5)
  const [selectColor, setSelectColor]  = useState(false)
  const [valueSelectColor, setValueSelectColor] = useState("0fffff");
  console.log(valueSelectColor)
  return (
    <div className="paint-wrapper">
      <div id="whiteBoard" className="paint-wrapper__container">
        <canvas id="canvas" className="canvasUI" ></canvas>
        {
          selectColor && 
          <div className="colors">
            <button onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#0000ff")} } type="button" value="#0000ff"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#009fff")} }  type="button" value="#009fff"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#0fffff")} }  type="button" value="#0fffff"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#bfffff")} }  type="button" value="#bfffff"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#333333")} }  type="button" value="#333333"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#666666")} }  type="button" value="#666666"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#999999")} }  type="button" value="#999999"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#ffcc66")} }  type="button" value="#ffcc66"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#ffcc00")} }  type="button" value="#ffcc00"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#ffff00")} }  type="button" value="#ffff00"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#ffff99")} }  type="button" value="#ffff99"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#003300")} }  type="button" value="#003300"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#555000")} }  type="button" value="#555000"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#00ff00")} }  type="button" value="#00ff00"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#99ff99")} }  type="button" value="#99ff99"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#f00000")} }  type="button" value="#f00000"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#ff6600")} }  type="button" value="#ff6600"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#ff9933")} }  type="button" value="#ff9933"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#f5deb3")} }  type="button" value="#f5deb3"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#330000")} }  type="button" value="#330000"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#663300")} }  type="button" value="#663300"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#cc6600")} }  type="button" value="#cc6600"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#deb887")} }  type="button" value="#deb887"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#aa0fff")} }  type="button" value="#aa0fff"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#cc66cc")} }  type="button" value="#cc66cc"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#ff66ff")} }  type="button" value="#ff66ff"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#ff99ff")} }  type="button" value="#ff99ff"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#e8c4e8")} }  type="button" value="#e8c4e8"></button>
            <button  onClick={() => { setSelectColor(!selectColor); setValueSelectColor("#ffffff")} }  type="button" value="#ffffff"></button>
          </div>
        }
        <div id="canvasBtns" className="canvasUI-task">
          <input
            type="range"
            name=""
            id="jsRange"
            min="0.1"
            max="10.0"
            value="5.0"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div>
            <button id="jsMode" className="canvasBtns"><i class="material-icons">create</i></button>
            <button id="jsErase" className="canvasBtns"><i class="material-icons">how_to_vote</i></button>
            {/* <button id="redpen" className="canvasBtns">Redpen</button> */}
            <button id="redpen" className="canvasBtns"><i class="material-icons" onClick={() => setSelectColor(!selectColor)}>brush</i></button>
            <button id="reset" className="canvasBtns"><i class="material-icons">clear</i></button>
          </div>
        </div>
      </div>
    </div>
  )
}



export default WhiteBoard

