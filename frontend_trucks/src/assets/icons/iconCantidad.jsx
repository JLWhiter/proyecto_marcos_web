
function iconCantidad({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5 3L7 21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M17 3L15.5 21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M3 8.5H21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M3 15.5H21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

export default iconCantidad
