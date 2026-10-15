import { useEffect, useRef, useState } from "react";
import logo from "../../assets/logo_sembrando.png";
import loginBackground from "../../assets/LoginIzquierdo.webp";
import messages from "../../data/loginMessages";

function LoginBrandPanel() {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [messageVisible, setMessageVisible] = useState(true);

  const transitionTimeoutRef = useRef(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageVisible(false);

      transitionTimeoutRef.current = window.setTimeout(() => {
        setCurrentMessage((previous) => (previous + 1) % messages.length);
        setMessageVisible(true);
      }, 650);
    }, 5000);

    return () => {
      window.clearInterval(interval);

      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  function changeMessage(index) {
    if (index === currentMessage || !messages.length) {
      return;
    }

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    setMessageVisible(false);

    transitionTimeoutRef.current = window.setTimeout(() => {
      setCurrentMessage(index);
      setMessageVisible(true);
    }, 350);
  }

  if (!messages.length) {
    return (
      <section className="relative flex h-[46%] w-full items-center justify-center overflow-hidden px-8 sm:px-12 lg:h-full lg:w-[56%] lg:px-16 xl:px-24 max-sm:h-auto max-sm:min-h-[245px] max-sm:pt-2.5 max-sm:pb-2 sm:max-lg:min-h-[320px]">
        <img
          src={loginBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 bg-emerald-950/20" />

        <div className="relative z-10 w-full max-w-xl text-center lg:text-left">
          <div className="mx-auto mb-6 flex h-[104px] w-[104px] items-center justify-center rounded-2xl bg-white p-4 shadow-xl shadow-black/20 sm:h-[116px] sm:w-[116px] sm:p-5 lg:mx-0 lg:mb-7 lg:h-[148px] lg:w-[148px] lg:p-2.5">
            <img src={logo} alt="Logo de Sembrando Perú" className="h-full w-full object-contain" />
          </div>

          <p className="mb-3 text-[11px] font-bold tracking-[0.28em] text-emerald-300 uppercase sm:text-xs">
            Sembrando Perú
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex h-[46%] w-full items-center justify-center overflow-hidden px-8 sm:px-12 lg:h-full lg:w-[56%] lg:px-16 xl:px-24 max-sm:h-auto max-sm:min-h-[245px] max-sm:pt-2.5 max-sm:pb-2 sm:max-lg:min-h-[320px]">
      <img
        src={loginBackground}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-emerald-950/20" />

      <div className="relative z-10 w-full max-w-xl text-center lg:text-left">
        <div className="mx-auto mb-6 flex h-[104px] w-[104px] items-center justify-center rounded-2xl bg-white p-4 shadow-xl shadow-black/20 sm:h-[116px] sm:w-[116px] sm:p-5 lg:mx-0 lg:mb-7 lg:h-[148px] lg:w-[148px] lg:p-2.5 max-sm:mb-3 max-sm:h-[76px] max-sm:w-[76px] max-sm:p-2.5">
          <img src={logo} alt="Logo de Sembrando Perú" className="h-full w-full object-contain" />
        </div>

        <p className="mb-3 text-[11px] font-bold tracking-[0.28em] text-emerald-300 uppercase sm:text-xs max-sm:mb-2 max-sm:text-[10px] max-sm:tracking-[0.22em]">
          Sembrando Perú
        </p>

        <div className="relative h-[190px] max-w-xl sm:h-[185px] lg:h-[200px] max-sm:h-[120px]">
          <div
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              messageVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            } `}
          >
            <h2 className="max-w-xl text-3xl leading-[1.08] font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-[2.7rem] xl:text-5xl max-sm:text-[1.7rem]">
              {messages[currentMessage].title}
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-6 text-white/85 drop-shadow-sm sm:text-base lg:text-lg lg:leading-7 max-sm:mt-1.5 max-sm:text-[13px] max-sm:leading-[1.35]">
              {messages[currentMessage].description}
            </p>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-center gap-2 lg:justify-start max-sm:pb-2">
          {messages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => changeMessage(index)}
              aria-label={`Mostrar mensaje ${index + 1}`}
              className={`h-1 cursor-pointer rounded-full transition-all duration-500 ${
                currentMessage === index
                  ? "w-10 bg-emerald-300"
                  : "w-2.5 bg-white/45 hover:bg-white/70"
              } `}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default LoginBrandPanel;
