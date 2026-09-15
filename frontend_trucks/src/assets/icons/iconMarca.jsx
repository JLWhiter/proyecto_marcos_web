
function iconMarca({ width = "18px", height = "18px", color = "#74777D", className }) {
    return (
        <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.59 13.41L11.17 22.83C11.05 22.95 10.9 23 10.75 23C10.6 23 10.45 22.95 10.33 22.83L1.17 13.67C0.95 13.45 0.95 13.1 1.17 12.88L10.59 3.46C10.81 3.24 11.1 3.1 11.4 3.1L20 3C21.1 3 22 3.9 22 5V13.6C22 13.9 21.86 14.19 21.64 14.41L20.59 13.41ZM7 11C7.83 11 8.5 10.33 8.5 9.5C8.5 8.67 7.83 8 7 8C6.17 8 5.5 8.67 5.5 9.5C5.5 10.33 6.17 11 7 11Z" fill={color}/>
        </svg>
    );
}

export default iconMarca
