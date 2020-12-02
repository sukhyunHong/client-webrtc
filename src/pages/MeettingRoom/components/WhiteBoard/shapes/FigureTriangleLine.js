import React from 'react';
export default class FigureRecLine extends React.Component {
  prepareData() {
    let rect = {
      x: this.props.path[0].x,
      y: this.props.path[0].y,
      width: this.props.path[this.props.path.length - 1].x - this.props.path[0].x,
      height: this.props.path[this.props.path.length - 1].y - this.props.path[0].y
    };
    return rect;
  }

  render() {
    let rect = this.prepareData();
    console.log(rect)
    return (<svg width={rect.x} height={rect.y}>
              <polygon points="250,60 100,400 400,400" class="triangle" />
      </svg>);
  }
}