import React from 'react';

interface CanvasProps {
    width: number;
    height: number;
}


const Canvas = ({ width, height }: CanvasProps) => {
    return <canvas height={height} width={width} />;
};


Canvas.defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight,
};


export default Canvas;