
function iconProveedor({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 5H16V16H2V5Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 8H20L22 11V16H16V8Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="2" stroke={color} strokeWidth="1.8"/>
            <circle cx="18" cy="18" r="2" stroke={color} strokeWidth="1.8"/>
        </svg>
    );
}

export default iconProveedor
