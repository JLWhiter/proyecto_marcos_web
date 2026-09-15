
function iconTipoDocumento({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V8L14 3Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 3V8H20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 13H16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 17H16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

export default iconTipoDocumento
