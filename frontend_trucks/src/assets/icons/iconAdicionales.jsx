
function iconAdicionales({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
            <path d="M12 8V16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 12H16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

export default iconAdicionales
