
function iconPuntoRecogo({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L3 7.5L12 12L21 7.5L12 3Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 7.5V16.5L12 21L21 16.5V7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 12V21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8.5 12.5L10.5 14.5L15 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default iconPuntoRecogo
