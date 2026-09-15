
function iconObservaciones({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H20V20H4V4Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 9H16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 13H16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 17H13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

export default iconObservaciones
