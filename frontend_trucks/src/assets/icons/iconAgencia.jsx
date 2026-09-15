
function iconAgencia({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 21H21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M4 21V8L12 3L20 8V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 21V14H15V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 8H9.01" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M15 8H15.01" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
    );
}

export default iconAgencia
