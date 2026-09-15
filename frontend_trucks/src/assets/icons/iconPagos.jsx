
function IconPagos({ width = "20px", height = "20px", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 6V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M15 9.5C15 8.12 13.66 7 12 7C10.34 7 9 8.12 9 9.5C9 10.88 10.34 12 12 12C13.66 12 15 13.12 15 14.5C15 15.88 13.66 17 12 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

export default IconPagos
