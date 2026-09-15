
function iconMoneda({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
            <path d="M12 6V18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M15 9.5C15 8.67 13.66 8 12 8C10.34 8 9 8.67 9 9.5C9 10.33 10.34 11 12 11C13.66 11 15 11.67 15 12.5C15 13.33 13.66 14 12 14C10.34 14 9 13.33 9 12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

export default iconMoneda
