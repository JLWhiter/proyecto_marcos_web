
function iconVenta({ width = "20px", height = "20px", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2H18V22L15 19.5L12 22L9 19.5L6 22V2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 7H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M9 11H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M9 15H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

export default iconVenta
