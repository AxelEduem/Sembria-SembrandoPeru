import { Link } from "react-router-dom";

import logoSembria from "@/assets/logo_sembria.webp";

function SidebarLogo({ collapsed }) {
  return (
    <div className={`flex h-[72px] items-center border-b border-slate-100 max-lg:h-[62px] ${collapsed ? "justify-center px-2" : "justify-center px-4"}`}>
      <Link to="/inicio" aria-label="Sembria - Inicio" className={`flex items-center justify-center transition-all duration-300 ease-out hover:scale-[1.02] ${collapsed ? "h-10 w-10" : "h-12 w-full max-w-[150px]"}`}>
        <img src={logoSembria} alt="Sembria" className={`object-contain transition-all duration-300 ease-out ${collapsed ? "h-10 w-10" : "h-12 w-auto max-w-full"}`} />
      </Link>
    </div>
  );
}

export default SidebarLogo;
