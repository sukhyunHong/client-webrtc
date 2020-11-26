import React, { useState } from 'react'

var DragDrop = props => {
  const [bgColor, setBgColor] = useState('transparent')

  const changeBgColor = (state) => {
    setBgColor(state ? 'green' : 'transparent')
  }

  return (
    <div style={{
      backgroundColor: bgColor
    }} className={props.className}
      // ref={ref}
      onDragEnter={(e) => {
        e.preventDefault()
        e.stopPropagation()
        changeBgColor(true)
        e.dataTransfer.dropEffect = 'copy'
        console.log('DragEnter', e.dataTransfer.items.length)
      }}

      onDragLeave={(e) => {
        e.preventDefault()
        e.stopPropagation()
        changeBgColor(false)
        console.log('onDragLeave')
      }}

      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('onDragOver')
      }}

      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        changeBgColor(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          console.log("send file")
          props.sendFiles(e.dataTransfer.files)
        }
      }}
    >
      {props.children}
    </div>
  )
}

export default DragDrop