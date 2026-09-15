
function iconMedioPago({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8"/>
            <path d="M2 10H22" stroke={color} strokeWidth="1.8"/>
            <path d="M6 15H10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

export default iconMedioPago
