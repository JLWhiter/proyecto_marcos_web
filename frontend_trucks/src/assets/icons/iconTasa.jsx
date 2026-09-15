
function iconTasa({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8H16V8C16 6.34315 17.3431 5 19 5C20.6569 5 22 6.34315 22 8V8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M20 16H8V16C8 17.6569 6.65685 19 5 19C3.34315 19 2 17.6569 2 16V16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M4 8V11.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M20 16V12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M7 8V10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M17 16V14" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

export default iconTasa
