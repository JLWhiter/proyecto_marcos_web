
function iconCodigo({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5H5V19H3V5Z" fill={color}/>
            <path d="M7 5H8V19H7V5Z" fill={color}/>
            <path d="M10 5H13V19H10V5Z" fill={color}/>
            <path d="M15 5H16V19H15V5Z" fill={color}/>
            <path d="M18 5H21V19H18V5Z" fill={color}/>
        </svg>
    );
}

export default iconCodigo
