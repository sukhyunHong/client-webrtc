import React, { useEffect, useLayoutEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Icon from '../../../../constants/icons'
import rough from "roughjs/bundled/rough.esm";
import html2canvas from 'html2canvas';
import './style.scss'


const generator = rough.generator();

function createElement(id, x1, y1, x2, y2, type) {
  const roughElement =
    type === "line"
      ? generator.line(x1, y1, x2, y2)
      : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  return { id, x1, y1, x2, y2, type, roughElement };
}

const nearPoint = (x, y, x1, y1, name) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};

const positionWithinElement = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;
  if (type === "rectangle") {
    const topLeft = nearPoint(x, y, x1, y1, "tl");
    const topRight = nearPoint(x, y, x2, y1, "tr");
    const bottomLeft = nearPoint(x, y, x1, y2, "bl");
    const bottomRight = nearPoint(x, y, x2, y2, "br");
    const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    return topLeft || topRight || bottomLeft || bottomRight || inside;
  } else {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    const start = nearPoint(x, y, x1, y1, "start");
    const end = nearPoint(x, y, x2, y2, "end");
    const inside = Math.abs(offset) < 1 ? "inside" : null;
    return start || end || inside;
  }
};

const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getElementAtPosition = (x, y, elements) => {
  return elements
    .map(element => ({ ...element, position: positionWithinElement(x, y, element) }))
    .find(element => element.position !== null);
};

const adjustElementCoordinates = element => {
  const { type, x1, y1, x2, y2 } = element;
  if (type === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return { x1, y1, x2, y2 };
    } else {
      return { x1: x2, y1: y2, x2: x1, y2: y1 };
    }
  }
};

const cursorForPosition = position => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};

const resizedCoordinates = (clientX, clientY, position, coordinates) => {
  const { x1, y1, x2, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return null; //should not really get here...
  }
};



function WhiteBoard(props) {


  const [elements, setElements] = useState([]);
  const [action, setAction] = useState("none"); 
  const [tool, setTool] = useState("line");
  const [selectedElement, setSelectedElement] = useState(null);



  // useEffect(() => {
  //   const canvas = document.getElementById("canvas");
  //   const ctx = canvas.getContext("2d");
  //   const range = document.getElementById("jsRange");
  //   const mode = document.getElementById("jsMode");
  //   const erase = document.getElementById("jsErase");
  //   const redpen = document.getElementById("redpen");
  //   const reset = document.getElementById("reset");

  //   canvas.width = 1740;
  //   canvas.height = 930;

  //   ctx.fillStyle = "white";
  //   ctx.fillRect(0, 0, canvas.width, canvas.height);

  //   ctx.strokeStyle = valueSelectColor;
  //   ctx.lineWidth = 2.5;

  //   let painting = false;
  //   let filling = false;

  //   const stopPainting = () => {
  //     painting = false;
  //   };

  //   const onMouseMove = e => {
  //     const x = e.offsetX;
  //     const y = e.offsetY;
  //     ctx.strokeStyle = valueSelectColor;
  //     if (!painting) {
  //       ctx.beginPath();
  //       ctx.moveTo(x, y);
  //     } else {
  //       ctx.lineTo(x, y);
  //       ctx.stroke();
  //     }
  //   };

  //   const startPainting = () => {
  //     painting = true;
  //   };
  //   const handleCanvasClick = () => {
  //   };
  //   const handleCM = e => {
  //     e.preventDefault();
  //   };

  //   if (canvas) {
  //     canvas.addEventListener("mousemove", onMouseMove);
  //     canvas.addEventListener("mousedown", startPainting);
  //     canvas.addEventListener("mouseup", stopPainting);
  //     canvas.addEventListener("mouseleave", stopPainting);
  //     canvas.addEventListener("click", handleCanvasClick);
  //     canvas.addEventListener("contextmenu", handleCM);
  //   }

  //   const handleRangeChange = e => {
  //     const brushWidth = e.target.value;
  //     ctx.lineWidth = brushWidth;
  //   };

  //   if (range) {
  //     range.addEventListener("input", handleRangeChange);
  //   }

  //   //Paint 클릭 시
  //   const handleModeClick = e => {
  //     console.log("asa")
  //     painting = false;
  //     ctx.strokeStyle = valueSelectColor;
  //     filling = false;
  //   };
  //   //Redpen 클릭 시
  //   const handleRedPen = e => {
  //     painting = false;
  //     ctx.strokeStyle = valueSelectColor;
  //     filling = false;
  //   }
  //   //Erase 클릭 시
  //   const handleEraseClick = e => {
  //     painting = false;
  //     ctx.strokeStyle = "white";
  //     filling = false;
  //   };

  //   const handleReset = e => {
  //     ctx.fillRect(0, 0, canvas.width, canvas.height);
  //   }
  //   if (mode) {
  //     mode.addEventListener("click", handleModeClick);
  //   }
  //   if (erase) {
  //     erase.addEventListener("click", handleEraseClick);
  //   }
  //   if (redpen) {
  //     redpen.addEventListener("click", handleRedPen);
  //   }
  //   if (reset) {
  //     reset.addEventListener("click", handleReset);
  //   }

  // }, [])

  const [value, setValue] = useState(5)
  const [selectColor, setSelectColor] = useState(false)
  const [valueSelectColor, setValueSelectColor] = useState("0fffff");






  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
  }, [elements]);

  const updateElement = (id, x1, y1, x2, y2, type) => {
    const updatedElement = createElement(id, x1, y1, x2, y2, type);
    const elementsCopy = [...elements];
    elementsCopy[id] = updatedElement;
    setElements(elementsCopy);
  };

  const handleMouseDown = event => {
    const { clientX, clientY } = event;
    console.log(clientX, clientY)
    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({ ...element, offsetX, offsetY });

        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      }
    } else {
      const id = elements.length;
      const element = createElement(id, clientX, clientY, clientX, clientY, tool);
      setElements(prevState => [...prevState, element]);
      setSelectedElement(element);
      setAction("drawing");
    }
  };

  const handleMouseMove = event => {
    const { clientX, clientY } = event;

    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements);
      event.target.style.cursor = element ? cursorForPosition(element.position) : "default";
    }

    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(index, x1, y1, clientX, clientY, tool);
    } else if (action === "moving") {
      const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const newX1 = clientX - offsetX;
      const newY1 = clientY - offsetY;
      updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type);
    } else if (action === "resizing") {
      const { id, type, position, ...coordinates } = selectedElement;
      const { x1, y1, x2, y2 } = resizedCoordinates(clientX, clientY, position, coordinates);
      updateElement(id, x1, y1, x2, y2, type);
    }
  };

  const handleMouseUp = () => {
    console.log(tool)
    // We can wrap the next 6 line with if(selectedElement) {} to avoid an issue as selectedElement can be null,
    // this will be updated in the next video.
    const index = selectedElement.id;
    const { id, type } = elements[index];
    if (action === "drawing" || action === "resizing") {
      const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
      updateElement(id, x1, y1, x2, y2, type);
    }
    setAction("none");
    setSelectedElement(null);
  };

  const handleSaveAs = () => {
    html2canvas(document.getElementById("canvas")).then(function (canvas) {
      const url = canvas.toDataURL("image/jpeg", 0.9)
      const link = document.createElement('a');
      link.setAttribute("href", url);
      link.setAttribute("download", ''); //! 안 됨 
      link.setAttribute("target", '_blank');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  const handleChangeColor = () => {

  }

  const handleReset = () => {

  }

  const handleResetCancel = () => {

  }

  const handleDel = () => {

  }

  const handlecheckCheck = () => {

  }
  return (
    <div className="paint-wrapper">
      <div id="whiteBoard" className="paint-wrapper__container">
        <canvas 
        width={window.innerWidth}
        height={window.innerHeight}
        id="canvas" 
        className="canvasUI"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ></canvas>
        {/* {
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
        } */}
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
            <button onClick={() => setTool("selection")}>
              <img src={Icon.selectIcon} />
              <p>선택</p>
            </button>
            <button onClick={() => setTool("text")}>
              <img src={Icon.textIcon} />
              <p>텍스트</p>
            </button>
            <button onClick={() => setTool("draw")}>
              <img src={Icon.drawIcon} />
              <p>그리기</p>
            </button>
            <button onClick={() => setTool("eraser")}>
              <img src={Icon.eraserIcon} />
              <p>지우기</p>
            </button>
            <button  onClick={() => setTool("line")} >
              <img src={Icon.lineIcon} />
              <p>선</p>
            </button>
            <button  onClick={() => setTool("figure")}>
              <img src={Icon.figureIcon} />
              <p>도형</p>
            </button>
            <button onClick={() => handleChangeColor()}>
              <img src={Icon.colorIcon} />
              <p>색상</p>
            </button>
            <button onClick={() => handleReset()}>
              <img src={Icon.resetIcon} />
              <p>재실행</p>
            </button>
            <button onClick={() => handleResetCancel()}>
              <img src={Icon.resetCancelIcon} />
              <p>실행취수</p>
            </button>
            <button onClick={() => handleDel()}>
              <img src={Icon.delIcon} />
              <p>지우기</p>
            </button>
            <button onClick={() => handlecheckCheck()}>
              <img src={Icon.checkCheckIcon} />
              <p>스탬프</p>
            </button>
            <button onClick={() => setTool("tag")}>
              <img src={Icon.tagIcon} />
              <p>태그</p>
            </button>
            <button onClick={() => handleSaveAs()}>
              <img src={Icon.saveIcon} />
              <p>저장</p>
            </button>

            {/* <button id="jsMode" className="canvasBtns"><i class="material-icons">{Icon.select}</i></button>
            <button id="jsErase" className="canvasBtns"><i class="material-icons">how_to_vote</i></button>
            {/* <button id="redpen" className="canvasBtns">Redpen</button> */}
            {/* <button id="redpen" className="canvasBtns"><i class="material-icons" onClick={() => setSelectColor(!selectColor)}>brush</i></button> */}
            {/* <button id="reset" className="canvasBtns"><i class="material-icons">clear</i></button> */}
          </div>
        </div>
      </div>
    </div>
  )
}



export default WhiteBoard

