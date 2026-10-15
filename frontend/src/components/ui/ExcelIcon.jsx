import excelIcon from "@/assets/Excel.webp";

function ExcelIcon({ className = "h-4 w-4" }) {
  return (
    <img
      src={excelIcon}
      alt=""
      aria-hidden="true"
      className={`${className} shrink-0 object-contain`}
    />
  );
}

export default ExcelIcon;
