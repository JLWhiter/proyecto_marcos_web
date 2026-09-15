
function iconDestino({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21C12 21 19 15.6111 19 10C19 6.13401 15.866 3 12 3C8.13401 3 5 6.13401 5 10C5 15.6111 12 21 12 21Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="10" r="2.5" stroke={color} strokeWidth="1.8"/>
        </svg>
    );
}

export default iconDestino
