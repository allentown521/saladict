import { useEffect } from 'react';
import logo from '/src-tauri/icons/icon.png';

export function ThumbWindow() {
    return (
        <div>
            <img
                draggable={false}
                style={{
                    display: 'block',
                    width: '20px',
                    height: '20px',
                    objectFit: 'contain'
                }}
                src={logo}
            />
        </div>
    )
}
